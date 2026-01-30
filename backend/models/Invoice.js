const { ObjectId } = require('mongodb');

class InvoiceModel {
    static fromRequest(data, userId) {
        const subtotal = data.items ? data.items.reduce((sum, item) => sum + (parseFloat(item.quantity) * parseFloat(item.price)), 0) : (data.subtotal || 0);
        const taxRate = parseFloat(data.taxRate) || 0;
        const taxAmount = subtotal * (taxRate / 100);
        const discount = parseFloat(data.discount) || 0;
        const total = subtotal + taxAmount - discount;

        return {
            invoiceNumber: data.invoiceNumber || `INV-${Date.now()}`,
            clientId: data.clientId,
            projectId: data.projectId || null,
            issueDate: data.issueDate || new Date().toISOString().split('T')[0],
            dueDate: data.dueDate || '',
            items: data.items || [],
            subtotal,
            taxRate,
            taxAmount,
            discount,
            total,
            status: data.status || 'Pending',
            notes: data.notes || '',
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

module.exports = InvoiceModel;
