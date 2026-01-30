const { collections } = require('../db');
const ExpenseModel = require('../models/Expense');

const expenseService = {
  getAll: async (userId) => {
    return await collections.expenses.find({ userId }).sort({ _id: -1 }).toArray();
  },

  getById: async (id, userId) => {
    const _id = ExpenseModel.toId(id);
    if (!_id) return null;
    return await collections.expenses.findOne({ _id, userId });
  },

  create: async (data, userId) => {
    const document = ExpenseModel.fromRequest(data, userId);
    const result = await collections.expenses.insertOne(document);
    return { id: result.insertedId, ...document };
  },

  update: async (id, data, userId) => {
    const _id = ExpenseModel.toId(id);
    if (!_id) return false;

    delete data._id;
    const document = ExpenseModel.fromRequest(data, userId);
    delete document.createdAt;

    const result = await collections.expenses.updateOne(
      { _id, userId },
      { $set: document }
    );
    return result.matchedCount > 0;
  },

  delete: async (id, userId) => {
    const _id = ExpenseModel.toId(id);
    if (!_id) return false;
    const result = await collections.expenses.deleteOne({ _id, userId });
    return result.deletedCount > 0;
  }
};

module.exports = expenseService;
