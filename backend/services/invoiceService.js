const { ObjectId } = require('mongodb');
const { collections } = require('../db');

const invoiceService = {
  getAll: async () => {
    return await collections.invoices.find({}).toArray();
  },

  getById: async (id) => {
    return await collections.invoices.findOne({ _id: new ObjectId(id) });
  },

  calculateTotals: (data) => {
    if (data.items) {
      data.subtotal = data.items.reduce((sum, item) => sum + (parseFloat(item.quantity) * parseFloat(item.price)), 0);
      data.taxAmount = data.taxRate ? data.subtotal * (parseFloat(data.taxRate) / 100) : 0;
      data.total = data.subtotal + data.taxAmount - (parseFloat(data.discount) || 0);
    }
    return data;
  },

  create: async (data) => {
    const processedData = invoiceService.calculateTotals(data);
    const result = await collections.invoices.insertOne(processedData);
    return { id: result.insertedId, ...processedData };
  },

  update: async (id, data) => {
    delete data._id;
    
    // If items are present, we might need to recalculate totals
    if (data.items) {
      const existing = await collections.invoices.findOne({ _id: new ObjectId(id) });
      const taxRate = data.taxRate !== undefined ? data.taxRate : (existing?.taxRate || 0);
      const discount = data.discount !== undefined ? data.discount : (existing?.discount || 0);
      
      data.subtotal = data.items.reduce((sum, item) => sum + (parseFloat(item.quantity) * parseFloat(item.price)), 0);
      data.taxAmount = data.subtotal * (parseFloat(taxRate) / 100);
      data.total = data.subtotal + data.taxAmount - parseFloat(discount);
    }

    const result = await collections.invoices.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...data, updatedAt: new Date() } }
    );
    return result.matchedCount > 0;
  },

  delete: async (id) => {
    const result = await collections.invoices.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }
};

module.exports = invoiceService;
