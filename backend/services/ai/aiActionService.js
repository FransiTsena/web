const { collections } = require('../../db');
const clientService = require('../clientService');
const projectService = require('../projectService');
const invoiceService = require('../invoiceService');
const paymentService = require('../paymentService');
const expenseService = require('../expenseService');

/**
 * AI Action Service
 * Bridges the AI's intent to actual system actions.
 */
const aiActionService = {
  /**
   * Get context summary for the AI to understand the current state
   */
  getSystemContext: async (userId) => {
    const [clients, projects] = await Promise.all([
      clientService.getAll(userId),
      projectService.getAll(userId)
    ]);

    return {
      clients: clients.map(c => ({ id: c._id, name: c.name, company: c.company })),
      projects: projects.map(p => ({ id: p._id, name: p.name, clientId: p.clientId, status: p.status }))
    };
  },

  /**
   * Execute discovery for AI based on text
   * This is a simple mock of what an AI might need to 'search'
   */
  findEntity: async (type, query, userId) => {
    const q = new RegExp(query, 'i');
    if (type === 'client') {
      return await collections.clients.find({ userId, $or: [{ name: q }, { company: q }] }).toArray();
    }
    if (type === 'project') {
      return await collections.projects.find({ userId, name: q }).toArray();
    }
    return [];
  },

  /**
   * The actual action execution (after user confirmation)
   */
  executeAction: async (actionType, params, userId) => {
    switch (actionType) {
      case 'CREATE_CLIENT':
        return await clientService.create(params, userId);
      case 'CREATE_PROJECT':
        return await projectService.create(params, userId);
      case 'CREATE_INVOICE':
        return await invoiceService.create(params, userId);
      case 'UPDATE_PROJECT_STATUS':
        const { id, status } = params;
        return await projectService.update(id, { status }, userId);
      default:
        throw new Error(`Unknown action type: ${actionType}`);
    }
  }
};

module.exports = aiActionService;
