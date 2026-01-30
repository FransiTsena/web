const { ObjectId } = require('mongodb');
const { collections } = require('../db');

const clientService = {
  getAll: async (userId) => {
    return await collections.clients.find({ userId }).toArray();
  },

  getById: async (id, userId) => {
    if (!id || !ObjectId.isValid(id)) return null;
    return await collections.clients.findOne({ _id: new ObjectId(id), userId });
  },

  create: async (data, userId) => {
    const document = { ...data, userId, createdAt: new Date() };
    const result = await collections.clients.insertOne(document);
    return { id: result.insertedId, ...document };
  },

  update: async (id, data, userId) => {
    if (!id || !ObjectId.isValid(id)) return false;
    delete data._id;
    const result = await collections.clients.updateOne(
      { _id: new ObjectId(id), userId },
      { $set: { ...data, updatedAt: new Date() } }
    );
    return result.matchedCount > 0;
  },

  delete: async (id, userId) => {
    if (!id || !ObjectId.isValid(id)) return false;
    const result = await collections.clients.deleteOne({ _id: new ObjectId(id), userId });
    return result.deletedCount > 0;
  }
};

module.exports = clientService;
