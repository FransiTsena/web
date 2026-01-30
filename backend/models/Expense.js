const { ObjectId } = require('mongodb');

class ExpenseModel {
    static fromRequest(data, userId) {
        return {
            description: data.description || '',
            amount: parseFloat(data.amount) || 0,
            category: data.category || 'Other',
            date: data.date || new Date().toISOString().split('T')[0],
            reference: data.reference || '',
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

module.exports = ExpenseModel;
