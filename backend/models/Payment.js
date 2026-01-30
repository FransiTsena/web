const { ObjectId } = require('mongodb');

class PaymentModel {
    static fromRequest(data, userId) {
        return {
            invoiceId: data.invoiceId,
            amount: parseFloat(data.amount) || 0,
            date: data.date || new Date().toISOString().split('T')[0],
            method: data.method || 'Bank Transfer',
            notes: data.notes || '',
            userId,
            createdAt: data.createdAt || new Date(),
            updatedAt: new Date()
        };
    }

    static toId(id) {
        if (!id || !ObjectId.isValid(id)) return null;
        return new ObjectId(id);
    }
}

module.exports = PaymentModel;
