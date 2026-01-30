const { ObjectId } = require('mongodb');
const { collections } = require('../db');

const projectService = {
  getAll: async (userId) => {
    return await collections.projects.find({ userId }).toArray();
  },

  getById: async (id, userId) => {
    if (!id || !ObjectId.isValid(id)) return null;
    return await collections.projects.findOne({ _id: new ObjectId(id), userId });
  },

  create: async (data, userId) => {
    // Ensure budget is a number, checking for both 'budget' and 'cost' (which AI sometimes uses)
    const budgetValue = data.budget !== undefined ? data.budget : data.cost;
    const projectData = {
      ...data,
      budget: parseFloat(budgetValue) || 0,
      status: data.status || 'Ongoing'
    };

    // Remove 'cost' if it was used as an alias
    delete projectData.cost;

    const document = { ...projectData, userId, createdAt: new Date() };
    const result = await collections.projects.insertOne(document);
    return { id: result.insertedId, ...document };
  },

  update: async (id, data, userId) => {
    if (!id || !ObjectId.isValid(id)) return false;
    delete data._id;

    // Ensure budget is a number if provided
    if (data.budget !== undefined || data.cost !== undefined) {
      const budgetValue = data.budget !== undefined ? data.budget : data.cost;
      data.budget = parseFloat(budgetValue) || 0;
      delete data.cost;
    }

    const result = await collections.projects.updateOne(
      { _id: new ObjectId(id), userId },
      { $set: { ...data, updatedAt: new Date() } }
    );
    return result.matchedCount > 0;
  },

  delete: async (id, userId) => {
    if (!id || !ObjectId.isValid(id)) return false;
    const result = await collections.projects.deleteOne({ _id: new ObjectId(id), userId });
    return result.deletedCount > 0;
  }
};

module.exports = projectService;
