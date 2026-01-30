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
      2. Propose an <action> if the user wants to "create", "update/edit", or "delete" something.
      3. Use the IDs from the Context above to link or modify items.
      4. If the user asks "how am I doing", use the 'totals' in the context to give a financial overview.

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

      Note: For project budgets, always use the key "budget".
      Note: When updating, only include fields that need to change, but ALWAYS include the "id".
      
      Output Format:
      - Natural response.
      - Optional: <action>{"type": "...", "data": {...}, "summary": "..."}</action>
    `;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      const fullPrompt = `${systemPrompt}\n\nRecent Conversation:\n${conversationContext}\nUser: ${message}\nAssistant:`;

      const response = await fetch(HOST_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: AI_MODEL,
          prompt: fullPrompt,
          stream: false
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Model '${AI_MODEL}' not found.`);
        }
        throw new Error(`Ai responded with ${response.status}`);
      }

      const data = await response.json();

      return {
        text: data.response,
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
