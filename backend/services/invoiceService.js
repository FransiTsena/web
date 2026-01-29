const { ObjectId } = require('mongodb');
const { collections } = require('../db');

const invoiceService = {
  getAll: async (userId) => {
    return await collections.invoices.find({ userId }).toArray();
  },

  getById: async (id, userId) => {
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
    return { id: result.insertedId, ...document };
  },

  update: async (id, data, userId) => {
    delete data._id;
    
    // If items are present, we might need to recalculate totals
    if (data.items) {
      const existing = await collections.invoices.findOne({ _id: new ObjectId(id), userId });
      const taxRate = data.taxRate !== undefined ? data.taxRate : (existing?.taxRate || 0);
      const discount = data.discount !== undefined ? data.discount : (existing?.discount || 0);
      
      data.subtotal = data.items.reduce((sum, item) => sum + (parseFloat(item.quantity) * parseFloat(item.price)), 0);
      data.taxAmount = data.subtotal * (parseFloat(taxRate) / 100);
      data.total = data.subtotal + data.taxAmount - parseFloat(discount);
    }

    const result = await collections.invoices.updateOne(
      { _id: new ObjectId(id), userId },
      { $set: { ...data, updatedAt: new Date() } }
    );
    return result.matchedCount > 0;
  },

  delete: async (id, userId) => {
    const result = await collections.invoices.deleteOne({ _id: new ObjectId(id), userId });
    return result.deletedCount > 0;
  }
};

module.exports = invoiceService;
