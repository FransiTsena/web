const { collections } = require('../db');
const ClientModel = require('../models/Client');

const clientService = {
  getAll: async (userId) => {
    return await collections.clients.find({ userId }).toArray();
  },

  getById: async (id, userId) => {
    const _id = ClientModel.toId(id);
    if (!_id) return null;
    return await collections.clients.findOne({ _id, userId });
  },

  create: async (data, userId) => {
    const document = ClientModel.fromRequest(data, userId);
    const result = await collections.clients.insertOne(document);
    return { id: result.insertedId, ...document };
  },

  update: async (id, data, userId) => {
    const _id = ClientModel.toId(id);
    if (!_id) return false;

    delete data._id;
    const document = ClientModel.fromRequest(data, userId);
    delete document.createdAt; // Prevent overwriting

    const result = await collections.clients.updateOne(
      { _id, userId },
      { $set: document }
    );
    return result.matchedCount > 0;
  },

  delete: async (id, userId) => {
    const _id = ClientModel.toId(id);
    if (!_id) return false;
    const result = await collections.clients.deleteOne({ _id, userId });
    return result.deletedCount > 0;
  }
};

module.exports = clientService;
