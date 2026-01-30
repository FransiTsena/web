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

    // 2. Prepare the prompt
    const systemPrompt = `
      You are a business assistant for a CRM called "FreelanceTracker".
      Current System Data:
      - Clients: ${JSON.stringify(context.clients)}
      - Projects: ${JSON.stringify(context.projects)}

      Your goal is to help users manage their business. 
      If a user wants to create something (client, project, invoice), you must recognize the intent and return a JSON action object.
      
      Output format:
      Return your conversational response, but wrap any PROPOSED ACTION in <action>JSON_OBJECT</action> tags.
      
      The action object should look like:
      {
        "type": "PROPOSE_CREATE_PROJECT",
        "data": { "name": "...", "clientId": "...", "budget": 0 },
        "summary": "Create a new project named '...' for client '...'"
      }

      Example: "I see you want to start a new website project for ABC Corp. I've prepared the details for you. <action>{\"type\": \"PROPOSE_CREATE_PROJECT\", \"data\": {\"name\": \"Website Revamp\", \"clientId\": \"123\"}, \"summary\": \"Create Project: Website Revamp\"}</action>"
      
      Supported types: PROPOSE_CREATE_CLIENT, PROPOSE_CREATE_PROJECT, PROPOSE_CREATE_INVOICE.
      
      Always be polite and professional. If you aren't sure which client they mean, ask for clarification using the 'Clients' list provided.
    `;

    try {
      console.log(`Sending request to Ollama (${AI_MODEL}) at ${HOST_API}...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout (better for cold starts)

      const response = await fetch(HOST_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: AI_MODEL,
          prompt: `${systemPrompt}\nUser: ${message}\nAssistant:`,
          stream: false
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Model '${AI_MODEL}' not found. Please run 'ollama pull ${AI_MODEL}'`);
        }
        throw new Error(`Ollama responded with ${response.status}`);
      }

      const data = await response.json();

      return {
        text: data.response,
      };
    } catch (error) {
      console.error('AI Service Error:', error.message);

      let action = "";
      if (context.clients.length > 0) {
        action = `<action>{"type": "PROPOSE_CREATE_PROJECT", "data": {"name": "New Project", "clientId": "${context.clients[0].id}"}, "summary": "Create Project: New Project"}</action>`;
      }

      return {
        text: `(AI Unavailable) I couldn't reach your local Mistral model. \n\n**Error:** ${error.message}\n**Suggested Fix:** Please ensure Ollama is running and you have the model installed with \`ollama pull mistral\`. I'm using ${HOST_ADDRESS}.`,
      };
    }
  }
};

module.exports = aiChatService;
