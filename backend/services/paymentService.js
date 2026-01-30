const { ObjectId } = require('mongodb');
const { collections } = require('../db');

const paymentService = {
  getAll: async (userId) => {
    return await collections.payments.find({ userId }).toArray();
  },

  getById: async (id, userId) => {
    return await collections.payments.findOne({ _id: new ObjectId(id), userId });
  },

  create: async (data, userId) => {
    const document = {
      ...data,
      amount: parseFloat(data.amount) || 0,
      userId,
      createdAt: new Date()
    };
    const result = await collections.payments.insertOne(document);
    return { id: result.insertedId, ...document };
  },

  update: async (id, data, userId) => {
    delete data._id;
    if (data.amount !== undefined) {
      data.amount = parseFloat(data.amount) || 0;
    }
    const result = await collections.payments.updateOne(
      { _id: new ObjectId(id), userId },
      { $set: { ...data, updatedAt: new Date() } }
    );
    return result.matchedCount > 0;
  },

  delete: async (id, userId) => {
    const result = await collections.payments.deleteOne({ _id: new ObjectId(id), userId });
    return result.deletedCount > 0;
  }
};

module.exports = paymentService;
