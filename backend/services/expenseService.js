const { ObjectId } = require('mongodb');
const { collections } = require('../db');

const expenseService = {
  getAll: async () => {
    return await collections.expenses.find({}).toArray();
  },

  getById: async (id) => {
    return await collections.expenses.findOne({ _id: new ObjectId(id) });
  },

  create: async (data) => {
    const result = await collections.expenses.insertOne(data);
    return { id: result.insertedId, ...data };
  },

  update: async (id, data) => {
    delete data._id;
    const result = await collections.expenses.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...data, updatedAt: new Date() } }
    );
    return result.matchedCount > 0;
  },

  delete: async (id) => {
    const result = await collections.expenses.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }
};

module.exports = expenseService;
