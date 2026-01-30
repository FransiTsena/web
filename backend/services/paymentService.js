const { collections } = require('../db');
const PaymentModel = require('../models/Payment');

const paymentService = {
  getAll: async (userId) => {
    return await collections.payments.find({ userId }).sort({ _id: -1 }).toArray();
  },

  getById: async (id, userId) => {
    const _id = PaymentModel.toId(id);
    if (!_id) return null;
    return await collections.payments.findOne({ _id, userId });
  },

  create: async (data, userId) => {
    const document = PaymentModel.fromRequest(data, userId);
    const result = await collections.payments.insertOne(document);
    return { id: result.insertedId, ...document };
  },

  update: async (id, data, userId) => {
    const _id = PaymentModel.toId(id);
    if (!_id) return false;

    delete data._id;
    const document = PaymentModel.fromRequest(data, userId);
    delete document.createdAt;

    const result = await collections.payments.updateOne(
      { _id, userId },
      { $set: document }
    );
    return result.matchedCount > 0;
  },

  delete: async (id, userId) => {
    const _id = PaymentModel.toId(id);
    if (!_id) return false;
    const result = await collections.payments.deleteOne({ _id, userId });
    return result.deletedCount > 0;
  }
};

module.exports = paymentService;
