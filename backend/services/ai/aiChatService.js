const aiActionService = require('./aiActionService');
require('dotenv').config();

// Configuration for Local AI
const HOST_ADDRESS = process.env.HOST_ADDRESS || 'http://127.0.0.1:11434';
const AI_MODEL = process.env.AI_MODEL || 'mistral';
const HOST_API = `${HOST_ADDRESS}/api/generate`;

const aiChatService = {
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
      
      Current Business State:
      ${JSON.stringify(context, null, 2)}

      Rules:
      1. CRITICAL: NEVER include an <action> tag for greetings, status updates, or general opinions.
      2. Propose an <action> if the user wants to "create", "update/edit", "delete", or "add/record" something.
      3. Use the IDs from the Context above to link or modify items. BE PROACTIVE: If you find a client/invoice that matches a partial name or description (like "Peter" or "Deployment"), use that ID directly.
      4. If the user asks "how am I doing", use the 'totals' in the context to give a financial overview.
      5. When recording a payment, use the current date (2026-01-30) unless specified otherwise.

      Supported Action Types:
      - PROPOSE_CREATE_CLIENT: { "name": "string", "email": "string" }
      - PROPOSE_CREATE_PROJECT: { "name": "string", "clientId": "ID", "budget": number }
      - PROPOSE_CREATE_INVOICE: { "invoiceNumber": "string", "clientId": "ID", "projectId": "ID", "items": [{"description": "...", "quantity": 1, "price": 100}], "status": "Pending" | "Paid" }
      - PROPOSE_CREATE_PAYMENT: { "invoiceId": "ID", "amount": number, "method": "Bank Transfer" | "Telebirr", "date": "YYYY-MM-DD" }
      - PROPOSE_CREATE_EXPENSE: { "description": "string", "amount": number, "category": "string", "date": "YYYY-MM-DD" }
      
      - PROPOSE_UPDATE_CLIENT: { "id": "ID", "name": "string", ... }
      - PROPOSE_UPDATE_PROJECT: { "id": "ID", "status": "In Progress" | "Completed", "budget": number, ... }
      - PROPOSE_UPDATE_INVOICE: { "id": "ID", "status": "Paid", ... }
      
      - PROPOSE_DELETE_CLIENT: { "id": "ID" }
      - PROPOSE_DELETE_PROJECT: { "id": "ID" }
      - PROPOSE_DELETE_INVOICE: { "id": "ID" }
      - PROPOSE_DELETE_PAYMENT: { "id": "ID" }
      - PROPOSE_DELETE_EXPENSE: { "id": "ID" }

      - PROPOSE_UPDATE_PAYMENT: { "id": "ID", "amount": number, ... }
      - PROPOSE_UPDATE_EXPENSE: { "id": "ID", "description": "string", ... }

      Internal Read Actions (Executed immediately to give you more info):
      - READ_CLIENT: { "id": "ID" }
      - READ_PROJECT: { "id": "ID" }
      - READ_INVOICE: { "id": "ID" }
      - READ_PAYMENT: { "id": "ID" }
      - READ_EXPENSE: { "id": "ID" }

      Note: For project budgets, always use the key "budget".
      Note: When updating, only include fields that need to change, but ALWAYS include the "id".
      Note: Use READ_ actions if you need full details (like line items or deep history) before answering.
      
      Output Format:
      - Natural response.
      - Optional: <action>{"type": "...", "data": {...}, "summary": "..."}</action>
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
        const actionMatch = lastAiResponse.match(/<action>([\s\S]*?)<\/action>/);
        if (actionMatch) {
          try {
            const action = JSON.parse(actionMatch[1]);
            if (action.type.startsWith('READ_')) {
              // Execute read immediately and continue loop
              const result = await aiActionService.executeAction(action.type, action.data, userId);
              currentPrompt += `${lastAiResponse}\nObservation: ${JSON.stringify(result)}\nAssistant:`;
              loopCount++;
              continue; // Next iteration of while loop
            }
          } catch (e) {
            console.error('Error parsing internal action:', e);
          }
        }
        
        // If no READ action, or we're done, break
        break;
      }

      return {
        text: lastAiResponse,
      };
    } catch (error) {
      console.error('AI Service Error:', error.message);

      return {
        text: `(AI Unavailable) I couldn't reach your local Mistral model. \n\n**Error:** ${error.message}\n**Suggested Fix:** Please ensure Ai is running and you have the model installed. I'm using ${HOST_ADDRESS}.`,
      };
    }
  }
};

module.exports = aiChatService;
