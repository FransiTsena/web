const { ObjectId } = require('mongodb');
const { collections } = require('../db');

const projectService = {
  getAll: async () => {
    return await collections.projects.find({}).toArray();
  },

  getById: async (id) => {
    return await collections.projects.findOne({ _id: new ObjectId(id) });
  },

  create: async (data) => {
    const result = await collections.projects.insertOne(data);
    return { id: result.insertedId, ...data };
  },

  update: async (id, data) => {
    delete data._id;
    const result = await collections.projects.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...data, updatedAt: new Date() } }
    );
    return result.matchedCount > 0;
  },

  delete: async (id) => {
    const result = await collections.projects.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }
};

module.exports = projectService;
