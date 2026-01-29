const { ObjectId } = require('mongodb');
const { collections } = require('../db');

const clientService = {
  getAll: async () => {
    return await collections.clients.find({}).toArray();
  },

  getById: async (id) => {
    return await collections.clients.findOne({ _id: new ObjectId(id) });
  },

  create: async (data) => {
    const result = await collections.clients.insertOne(data);
    return { id: result.insertedId, ...data };
  },

  update: async (id, data) => {
    delete data._id;
    const result = await collections.clients.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...data, updatedAt: new Date() } }
    );
    return result.matchedCount > 0;
  },

  delete: async (id) => {
    const result = await collections.clients.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }
};

module.exports = clientService;
