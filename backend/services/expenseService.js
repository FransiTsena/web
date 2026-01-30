const { ObjectId } = require('mongodb');
const { collections } = require('../db');

const expenseService = {
  getAll: async (userId) => {
    return await collections.expenses.find({ userId }).sort({ _id: -1 }).toArray();
  },

  getById: async (id, userId) => {
    if (!id || !ObjectId.isValid(id)) return null;
    return await collections.expenses.findOne({ _id: new ObjectId(id), userId });
  },

  create: async (data, userId) => {
    const document = {
      ...data,
      amount: parseFloat(data.amount) || 0,
      userId,
      createdAt: new Date()
    };
    const result = await collections.expenses.insertOne(document);
    return { id: result.insertedId, ...document };
  },

  update: async (id, data, userId) => {
    if (!id || !ObjectId.isValid(id)) return false;
    delete data._id;
    if (data.amount !== undefined) {
      data.amount = parseFloat(data.amount) || 0;
    }
    const result = await collections.expenses.updateOne(
      { _id: new ObjectId(id), userId },
      { $set: { ...data, updatedAt: new Date() } }
    );
    return result.matchedCount > 0;
  },

  delete: async (id, userId) => {
    if (!id || !ObjectId.isValid(id)) return false;
    const result = await collections.expenses.deleteOne({ _id: new ObjectId(id), userId });
    return result.deletedCount > 0;
  }
};

module.exports = expenseService;
