const { ObjectId } = require('mongodb');
const { collections } = require('../db');

const paymentService = {
  getAll: async () => {
    return await collections.payments.find({}).toArray();
  },

  getById: async (id) => {
    return await collections.payments.findOne({ _id: new ObjectId(id) });
  },

  create: async (data) => {
    const result = await collections.payments.insertOne(data);
    return { id: result.insertedId, ...data };
  },

  update: async (id, data) => {
    delete data._id;
    const result = await collections.payments.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...data, updatedAt: new Date() } }
    );
    return result.matchedCount > 0;
  },

  delete: async (id) => {
    const result = await collections.payments.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }
};

module.exports = paymentService;
