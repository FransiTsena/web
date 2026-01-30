const { collections } = require('../db');
const InvoiceModel = require('../models/Invoice');

const invoiceService = {
  getAll: async (userId) => {
    return await collections.invoices.find({ userId }).toArray();
  },

  getById: async (id, userId) => {
    const _id = InvoiceModel.toId(id);
    if (!_id) return null;
    return await collections.invoices.findOne({ _id, userId });
  },

  create: async (data, userId) => {
    const document = InvoiceModel.fromRequest(data, userId);
    const result = await collections.invoices.insertOne(document);

    // Auto-create payment if status is Paid
    if (data.status === 'Paid') {
      await collections.payments.insertOne({
        invoiceId: result.insertedId.toString(),
        amount: document.total || 0,
        date: new Date().toISOString().split('T')[0],
        method: 'Bank Transfer',
        notes: 'Automatically created from invoice creation',
        userId,
        createdAt: new Date()
      });
    }

    return { id: result.insertedId, ...document };
  },

  update: async (id, data, userId) => {
    const _id = InvoiceModel.toId(id);
    if (!_id) return false;

    delete data._id;

    // Fetch existing invoice to check status transition
    const existing = await collections.invoices.findOne({ _id, userId });
    if (!existing) return false;

    const document = InvoiceModel.fromRequest({ ...existing, ...data }, userId);
    delete document.createdAt; // Prevent overwriting creation date

    // Handle status change to Paid (create payment)
    if (data.status === 'Paid' && existing.status !== 'Paid') {
      const paymentAmount = document.total;
      if (paymentAmount > 0) {
        // Check if a payment for this invoice already exists to avoid duplicates
        const existingPayment = await collections.payments.findOne({ invoiceId: _id.toString(), userId });
        if (!existingPayment) {
          await collections.payments.insertOne({
            invoiceId: _id.toString(),
            amount: paymentAmount,
            date: new Date().toISOString().split('T')[0],
            method: 'Bank Transfer',
            notes: 'Automatically created from invoice status update',
            userId,
            createdAt: new Date()
          });
        }
      }
    }

    const result = await collections.invoices.updateOne(
      { _id, userId },
      { $set: document }
    );
    return result.matchedCount > 0;
  },

  delete: async (id, userId) => {
    const _id = InvoiceModel.toId(id);
    if (!_id) return false;
    const result = await collections.invoices.deleteOne({ _id, userId });
    return result.deletedCount > 0;
  }
};

module.exports = invoiceService;
