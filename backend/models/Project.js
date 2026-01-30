const { ObjectId } = require('mongodb');

class ProjectModel {
    /**
     * Transforms raw data into a clean project document
     */
    static fromRequest(data, userId) {
        const budgetValue = data.budget !== undefined ? data.budget : data.cost;

        const project = {
            name: data.name,
            clientId: data.clientId,
            description: data.description || '',
            budget: parseFloat(budgetValue) || 0,
            status: data.status || 'Ongoing',
            startDate: data.startDate || null,
            endDate: data.endDate || null,
            userId: userId,
            updatedAt: new Date()
        };

        if (!project.createdAt) {
            project.createdAt = new Date();
        }

        return project;
    }

    /**
     * Helper to ensure ID is a valid ObjectId
     */
    static toId(id) {
        if (!id || !ObjectId.isValid(id)) return null;
        return new ObjectId(id);
    }
}

module.exports = ProjectModel;
