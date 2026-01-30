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

    // Create lookup maps for richer context
    const clientMap = Object.fromEntries(clients.map(c => [c._id.toString(), c.name]));
    const projectMap = Object.fromEntries(projects.map(p => [p._id.toString(), p.name]));
    const invoiceLookup = Object.fromEntries(invoices.map(i => [i._id.toString(), {
      projectName: projectMap[i.projectId] || 'General',
      clientName: clientMap[i.clientId] || 'Unknown'
    }]));

    return {
      clients: clients.map(c => ({ id: c._id, name: c.name, company: c.company })),
      projects: projects.map(p => ({
        id: p._id,
        name: p.name,
        clientName: clientMap[p.clientId] || 'Unknown',
        status: p.status
      })),
      invoices: invoices.map(i => ({
        id: i._id,
        number: i.invoiceNumber,
        total: i.total,
        status: i.status,
        projectName: projectMap[i.projectId] || 'General',
        clientName: clientMap[i.clientId] || 'Unknown'
      })),
      recentPayments: payments.slice(0, 10).map(p => {
        const info = invoiceLookup[p.invoiceId] || {};
        return {
          id: p._id,
          amount: p.amount,
          method: p.method,
          date: p.date,
          projectName: info.projectName || 'Unknown',
          clientName: info.clientName || 'Unknown'
        };
      }),
      recentExpenses: expenses.slice(0, 10).map(e => ({
        id: e._id,
        description: e.description,
        amount: e.amount,
        category: e.category,
        date: e.date
      })),
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

    // Extract ID if it exists (for updates/reads)
    const id = params.id || params._id;

    // Remove internal AI tracking fields
    const internalFields = ['id', '_id', 'projectName', 'clientName', 'itemName', 'summary', 'type'];

    // Cleanup params before sending to services
    const cleanData = { ...params };
    internalFields.forEach(field => delete cleanData[field]);

    // Sanitize dates to prevent "Invalid Date" errors
    if (cleanData.date) {
      const parsedDate = new Date(cleanData.date);
      if (isNaN(parsedDate.getTime())) {
        cleanData.date = new Date().toISOString().split('T')[0];
      }
    }

    switch (cleanActionType) {
      case 'CREATE_CLIENT':
        return await clientService.create(cleanData, userId);
      case 'CREATE_PROJECT':
        return await projectService.create(cleanData, userId);
      case 'CREATE_INVOICE':
        return await invoiceService.create(cleanData, userId);
      case 'CREATE_PAYMENT':
        return await paymentService.create(cleanData, userId);
      case 'CREATE_EXPENSE':
        return await expenseService.create(cleanData, userId);

      // Read Actions (Often used internally by AI to get more details)
      case 'READ_CLIENT':
        return await clientService.getById(id, userId);
      case 'READ_PROJECT':
        return await projectService.getById(id, userId);
      case 'READ_INVOICE':
        return await invoiceService.getById(id, userId);
      case 'READ_PAYMENT':
        return await paymentService.getById(id, userId);
      case 'READ_EXPENSE':
        return await expenseService.getById(id, userId);

      // Updates Actions
      case 'UPDATE_CLIENT':
        return await clientService.update(id, cleanData, userId);
      case 'UPDATE_PROJECT':
        return await projectService.update(id, cleanData, userId);
      case 'UPDATE_INVOICE':
        return await invoiceService.update(id, cleanData, userId);
      case 'UPDATE_PAYMENT':
        return await paymentService.update(id, cleanData, userId);
      case 'UPDATE_EXPENSE':
        return await expenseService.update(id, cleanData, userId);
      case 'UPDATE_PROJECT_STATUS':
        return await projectService.update(id, { status: cleanData.status }, userId);
      // Delte Actions
      case 'DELETE_CLIENT':
        return await clientService.delete(id, userId);
      case 'DELETE_PROJECT':
        return await projectService.delete(id, userId);
      case 'DELETE_INVOICE':
        return await invoiceService.delete(id, userId);
      case 'DELETE_PAYMENT':
        return await paymentService.delete(id, userId);
      case 'DELETE_EXPENSE':
        return await expenseService.delete(id, userId);

      default:
        throw new Error(`Unknown action type: ${cleanActionType}`);
    }
  }
};

module.exports = aiActionService;
