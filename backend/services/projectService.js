const { ObjectId } = require('mongodb');
const { collections } = require('../db');
const ProjectModel = require('../models/Project');

const projectService = {
  getAll: async (userId) => {
    return await collections.projects.find({ userId }).toArray();
  },

  getById: async (id, userId) => {
    const _id = ProjectModel.toId(id);
    if (!_id) return null;
    return await collections.projects.findOne({ _id, userId });
  },

  create: async (data, userId) => {
    const document = ProjectModel.fromRequest(data, userId);
    const result = await collections.projects.insertOne(document);
    return { id: result.insertedId, ...document };
  },

  update: async (id, data, userId) => {
    const _id = ProjectModel.toId(id);
    if (!_id) return false;

    delete data._id;
    const document = ProjectModel.fromRequest(data, userId);

    // For updates, we don't want to overwrite createdAt
    delete document.createdAt;

    const result = await collections.projects.updateOne(
      { _id, userId },
      { $set: document }
    );
    return result.matchedCount > 0;
  },

  delete: async (id, userId) => {
    const _id = ProjectModel.toId(id);
    if (!_id) return false;
    const result = await collections.projects.deleteOne({ _id, userId });
    return result.deletedCount > 0;
  }
};

module.exports = projectService;
