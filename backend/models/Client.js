const { ObjectId } = require('mongodb');

class ClientModel {
    static fromRequest(data, userId) {
        return {
            name: data.name,
            email: data.email || '',
            phone: data.phone || '',
            company: data.company || '',
            address: data.address || '',
            userId: userId,
            createdAt: data.createdAt || new Date(),
            updatedAt: new Date()
        };
    }

    static toId(id) {
        if (!id || !ObjectId.isValid(id)) return null;
        return new ObjectId(id);
    }
}

module.exports = ClientModel;
