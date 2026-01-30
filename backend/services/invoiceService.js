const { ObjectId } = require('mongodb');
const { collections } = require('../db');

const invoiceService = {
  getAll: async (userId) => {
    return await collections.invoices.find({ userId }).toArray();
  },

  getById: async (id, userId) => {
    if (!id || !ObjectId.isValid(id)) return null;
    return await collections.invoices.findOne({ _id: new ObjectId(id), userId });
  },

  calculateTotals: (data) => {
    if (data.items) {
      data.subtotal = data.items.reduce((sum, item) => sum + (parseFloat(item.quantity) * parseFloat(item.price)), 0);
      data.taxAmount = data.taxRate ? data.subtotal * (parseFloat(data.taxRate) / 100) : 0;
      data.total = data.subtotal + data.taxAmount - (parseFloat(data.discount) || 0);
    }
    return data;
  },

  create: async (data, userId) => {
    const processedData = invoiceService.calculateTotals(data);
    const document = { ...processedData, userId, createdAt: new Date() };
    const result = await collections.invoices.insertOne(document);

    // Auto-create payment if status is Paid
    if (data.status === 'Paid') {
      await collections.payments.insertOne({
        invoiceId: result.insertedId.toString(),
        amount: processedData.total || 0,
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
    if (!id || !ObjectId.isValid(id)) return false;
    delete data._id;

    // Fetch existing invoice to check status transition and get current values
    const existing = await collections.invoices.findOne({ _id: new ObjectId(id), userId });
    if (!existing) return false;

    // If items are present, we might need to recalculate totals
    if (data.items) {
      const taxRate = data.taxRate !== undefined ? data.taxRate : (existing.taxRate || 0);
      const discount = data.discount !== undefined ? data.discount : (existing.discount || 0);

      data.subtotal = data.items.reduce((sum, item) => sum + (parseFloat(item.quantity) * parseFloat(item.price)), 0);
      data.taxAmount = data.subtotal * (parseFloat(taxRate) / 100);
      data.total = data.subtotal + data.taxAmount - parseFloat(discount);
    }

    // Auto-create payment if status is changing to 'Paid'
    if (data.status === 'Paid' && existing.status !== 'Paid') {
      const paymentAmount = data.total !== undefined ? data.total : (existing.total || 0);

      // Check if a payment for this invoice already exists to avoid duplicates
      const existingPayment = await collections.payments.findOne({ invoiceId: id, userId });
      if (!existingPayment) {
        await collections.payments.insertOne({
          invoiceId: id,
          amount: paymentAmount,
          date: new Date().toISOString().split('T')[0],
          method: 'Bank Transfer',
          notes: 'Automatically created from invoice status update',
          userId,
          createdAt: new Date()
        });
      }
    }

    const result = await collections.invoices.updateOne(
      { _id: new ObjectId(id), userId },
      { $set: { ...data, updatedAt: new Date() } }
    );
    return result.matchedCount > 0;
  },

  delete: async (id, userId) => {
    if (!id || !ObjectId.isValid(id)) return false;
    const result = await collections.invoices.deleteOne({ _id: new ObjectId(id), userId });
    return result.deletedCount > 0;
  }
};

module.exports = invoiceService;
