const aiActionService = require('./aiActionService');
require('dotenv').config();

// Configuration for Local AI
const HOST_ADDRESS = process.env.HOST_ADDRESS || 'http://127.0.0.1:11434';
const AI_MODEL = process.env.AI_MODEL || 'mistral';
const HOST_API = `${HOST_ADDRESS}/api/generate`;

const aiChatService = {
  // Helper to extract action from various formats (custom or native model tags)
  extractAction: (text) => {
    // 1. Try custom <action> format
    const actionMatch = text.match(/<action>([\s\S]*?)<\/action>/);
    if (actionMatch) {
      try {
        const jsonStr = actionMatch[1].replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
      } catch (e) { return null; }
    }

    // 2. Try native model tool format (DeepSeek/Mistral)
    // Format: <｜tool▁call▁begin｜>function<｜tool▁sep｜>NAME ```json DATA ```
    const nativeMatch = text.match(/<｜tool▁call▁begin｜>.*<｜tool▁sep｜>\s*(\w+)\s*(?:```json)?\s*(\{[\s\S]*?\})\s*(?:```)?/);
    if (nativeMatch) {
      try {
        return { type: nativeMatch[1], data: JSON.parse(nativeMatch[2]) };
      } catch (e) { return null; }
    }

    return null;
  },

  // Helper to remove internal tools/outputs from final text
  cleanFinalResponse: (text) => {
    return text
      .replace(/<｜tool▁calls▁begin｜>[\s\S]*?<｜tool▁outputs▁end｜>/g, '') // Remove native tool blocks
      .replace(/<action>([\s\S]*?)<\/action>/g, (match, content) => {
        try {
          // Clean the content first
          const jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();
          const action = JSON.parse(jsonStr);

          // Remove internal READ actions entirely
          if (action && action.type && action.type.startsWith('READ_')) return '';

          // For PROPOSE_ actions, return a clean <action> tag with no markdown
          return action ? `<action>${JSON.stringify(action)}</action>` : '';
        } catch (e) {
          // If we can't parse it even after cleaning, just remove the tag to avoid crashing UI
          return '';
        }
      })
      .trim();
  },

  processChat: async (message, history = [], userId) => {
    // 1. Get system context (clients/projects) to help the AI reconcile names
    const context = await aiActionService.getSystemContext(userId);

    // 2. Format History for context
    const conversationContext = history.map(msg =>
      `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}`
    ).join('\n');

    // 3. Prepare the prompt
    const systemPrompt = `
      You are a professional business assistant for "FreelanceTracker" CRM.
      
      Today's Date: ${new Date().toISOString().split('T')[0]} (YYYY-MM-DD)

      Current Business State:
      ${JSON.stringify(context, null, 2)}

      Rules:
      1. CRITICAL: Use PROPOSE_CREATE_PAYMENT when a user says they "paid" or "received money". DO NOT use UPDATE_PROJECT for payments.
      2. Every payment MUST be linked to an invoice. If you can't find an invoice for the project/client, use a READ_INVOICE action or ask the user which invoice it belongs to.
      3. Use IDs from Context. CRITICAL FOR UPDATES: To update a Payment or Expense, use its own "id" field (e.g., from recentPayments). DO NOT use the "invoiceId" for updating a payment.
      4. DO NOT explain your internal steps.
      5. Final answers MUST include a friendly natural response.
      6. Note on Data: In the "data" object of your proposal, ALWAYS include descriptive fields (like "clientName", "projectName") alongside IDs so the user can see what they are confirming.
      7. For any date fields, use ${new Date().toISOString().split('T')[0]} unless the user specifies otherwise.
      8. Multi-step Workflow: If a user specifies a project for a new client:
         - STEP 1: Propose creating the client.
         - STEP 2 (After confirmation): Propose creating the project using the newly created client's ID.
      9. Reconcile Names: Before creating a client or project, check the "Current Business State". If "Melika" exists in the client list, USE HER ID instead of proposing to create her again. Case-insensitive matching is preferred.
      10. Decisiveness: When a user says "continue", "yes", or "go ahead", immediately PROPOSE the next logical action based on your previous conversation. Do not just say you will do it; use the <action> tag to actually provide the proposal.

      Conversation Style: 
      - Start with: "Hello! I am your AI Business Assistant. I can help you create projects, manage clients, or answer questions about your business. What can I do for you today?" if it's the start.
      - Be conversational and polite. 
      - If details like "budget" or "project name" are missing, ask the user. Example: "I've created a new project for Melika. The project will be named 'Pet Adoption Website' with a budget of 1000 birr. Would you like to confirm this?"

      Supported Action Types:
      - PROPOSE_CREATE_CLIENT: { "name": "string", "email": "string" }
      - PROPOSE_CREATE_PROJECT: { "name": "string", "clientId": "ID", "budget": number }
      - PROPOSE_CREATE_INVOICE: { "invoiceNumber": "string", "clientId": "ID", "projectId": "ID", "items": [{"description": "...", "quantity": 1, "price": 100}], "status": "Pending" | "Paid" }
      - PROPOSE_CREATE_PAYMENT: { "invoiceId": "ID", "amount": number, "method": "Bank Transfer" | "Telebirr", "date": "${new Date().toISOString().split('T')[0]}", "projectName": "string", "clientName": "string" }
      - PROPOSE_CREATE_EXPENSE: { "description": "string", "amount": number, "category": "string", "date": "${new Date().toISOString().split('T')[0]}" }
      
      - PROPOSE_UPDATE_CLIENT/PROJECT/INVOICE/PAYMENT/EXPENSE: { "id": "ID", ...fields }
      - PROPOSE_DELETE_CLIENT/PROJECT/INVOICE/PAYMENT/EXPENSE: { "id": "ID" }

      Internal Data Retrieval (Silent):
      - READ_CLIENT, READ_PROJECT, READ_INVOICE, READ_PAYMENT, READ_EXPENSE: { "id": "ID" }

      Format:
      - To read data: <action>{"type": "READ_PROJECT", "data": {"id": "..."}}</action>
      - To propose a final action: Your natural response <action>{"type": "PROPOSE_...", "data": {...}, "summary": "..."}</action>
      
      CRITICAL: ALWAYS wrap the JSON action in <action> and </action> tags. NEVER output the JSON alone. 
      CRITICAL: ALWAYS output a natural language sentence before the action tag.
      Rule for Dates: Use the YYYY-MM-DD format. Today is ${new Date().toISOString().split('T')[0]}.
      Example: I've prepared the payment details for you. <action>{"type": "PROPOSE...", "data": {"date": "${new Date().toISOString().split('T')[0]}", ...}, "summary": "..."}</action>
    `;

    try {
      let currentPrompt = `${systemPrompt}\n\nRecent Conversation:\n${conversationContext}\nUser: ${message}\nAssistant:`;
      let lastAiResponse = '';
      let loopCount = 0;
      const MAX_LOOPS = 3;

      while (loopCount < MAX_LOOPS) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        const response = await fetch(HOST_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: AI_MODEL,
            prompt: currentPrompt,
            stream: false
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Ai responded with ${response.status}`);
        }

        const data = await response.json();
        lastAiResponse = data.response;

        // Check for internal READ actions
        const action = aiChatService.extractAction(lastAiResponse);
        if (action && action.type && action.type.startsWith('READ_')) {
          try {
            // Execute read immediately and continue loop
            const result = await aiActionService.executeAction(action.type, action.data, userId);
            const observation = result ? JSON.stringify(result) : "ERROR: Record not found.";
            currentPrompt += `${lastAiResponse}\nObservation: ${observation}\nAssistant:`;
            loopCount++;
            continue; // Next iteration of while loop
          } catch (e) {
            console.error('Error executing internal action:', e);
          }
        }

        // If no READ action, or we're done, break
        break;
      }

      return {
        text: aiChatService.cleanFinalResponse(lastAiResponse),
      };
    } catch (error) {
      console.error('AI Service Error:', error.message);

      return {
        text: `(AI Unavailable) I couldn't reach your local model. \n\n**Error:** ${error.message}\n**Suggested Fix:** Please ensure Ai is running and you have the model installed. I'm using ${HOST_ADDRESS}.`,
      };
    }
  }
};

module.exports = aiChatService;
