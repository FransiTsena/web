const aiActionService = require('./aiActionService');

// This assumes Ollama or a similar local provider is running at this endpoint
const OLLAMA_API = 'http://localhost:11434/api/generate';

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
      const response = await fetch(OLLAMA_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'mistral',
          prompt: `${systemPrompt}\nUser: ${message}\nAssistant:`,
          stream: false
        })
      });

      if (!response.ok) throw new Error(`Ollama responded with ${response.status}`);
      const data = await response.json();

      return {
        text: data.response,
      };
    } catch (error) {
      console.error('AI Service Error:', error.message);
      // Fallback/Simulated response if Ollama isn't running
      return {
        text: `(Local AI Simulation) I've analyzed your request: "${message}". It looks like you want to perform an action. Since I'm in simulation mode, I've prepared a suggestion for you. <action>{"type": "PROPOSE_CREATE_PROJECT", "data": {"name": "New AI Project", "clientId": "${context.clients[0]?.id || ''}"}, "summary": "Create Project: New AI Project"}</action>`,
      };
    }
  }
};

module.exports = aiChatService;
