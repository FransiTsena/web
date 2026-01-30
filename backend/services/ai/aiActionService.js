const { collections } = require('../../db');
const clientService = require('../clientService');
const projectService = require('../projectService');
const invoiceService = require('../invoiceService');
const paymentService = require('../paymentService');
const expenseService = require('../expenseService');


// AI Action Service
//Bridges the AI's intent to actual system actions.

const aiActionService = {
  //Get context summary for the AI to understand the current state

  getSystemContext: async (userId) => {
    const [clients, projects, invoices, payments, expenses] = await Promise.all([
      clientService.getAll(userId),
      projectService.getAll(userId),
      invoiceService.getAll(userId),
      paymentService.getAll(userId),
      expenseService.getAll(userId)
    ]);

    return {
      clients: clients.map(c => ({ id: c._id, name: c.name, company: c.company })),
      projects: projects.map(p => ({ id: p._id, name: p.name, clientId: p.clientId, status: p.status })),
      invoices: invoices.map(i => ({ id: i._id, number: i.invoiceNumber, total: i.total, status: i.status, projectId: i.projectId })),
      recentPayments: payments.slice(-5).map(p => ({ amount: p.amount, method: p.method, date: p.date })),
      totals: {
        revenue: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
        expenses: expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
      }
    };
  },



  // The actual action execution (after user confirmation)
  executeAction: async (actionType, params, userId) => {
    // Strip PROPOSE_ prefix if present
    const cleanActionType = actionType.replace('PROPOSE_', '');
    const { id, ...data } = params;

    switch (cleanActionType) {
      case 'CREATE_CLIENT':
        return await clientService.create(params, userId);
      case 'CREATE_PROJECT':
        return await projectService.create(params, userId);
      case 'CREATE_INVOICE':
        return await invoiceService.create(params, userId);
      case 'CREATE_PAYMENT':
        return await paymentService.create(params, userId);
      case 'CREATE_EXPENSE':
        return await expenseService.create(params, userId);
      // Updates Actions
      case 'UPDATE_CLIENT':
        return await clientService.update(id, data, userId);
      case 'UPDATE_PROJECT':
        return await projectService.update(id, data, userId);
      case 'UPDATE_INVOICE':
        return await invoiceService.update(id, data, userId);
      case 'UPDATE_PAYMENT':
        return await paymentService.update(id, data, userId);
      case 'UPDATE_EXPENSE':
        return await expenseService.update(id, data, userId);

      case 'UPDATE_PROJECT_STATUS':
        return await projectService.update(id, { status: data.status }, userId);
      // Delte Actions
      case 'DELETE_CLIENT':
        return await clientService.delete(id, userId);
      case 'DELETE_PROJECT':
        return await projectService.delete(id, userId);
      case 'DELETE_INVOICE':
        return await invoiceService.delete(id, userId);

      default:
        throw new Error(`Unknown action type: ${cleanActionType}`);
    }
  }
};

module.exports = aiActionService;
