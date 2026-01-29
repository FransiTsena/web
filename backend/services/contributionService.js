const { collections } = require('../db');

const contributionService = {
  getYearlyContributions: async (year) => {
    // Fetch real data from the database
    const [invoices, payments, expenses] = await Promise.all([
      collections.invoices.find({}).toArray(),
      collections.payments.find({}).toArray(),
      collections.expenses.find({}).toArray()
    ]);

    const dailyActivity = new Map();
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    // Initialize all days
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = new Date(d).toISOString().split('T')[0];
      dailyActivity.set(dateStr, 0);
    }

    // Helper functions for common logic
    const addActivity = (items, dateField) => {
      items.forEach(item => {
        if (item[dateField]) {
          const date = new Date(item[dateField]);
          if (date.getFullYear() === year) {
            const dateStr = date.toISOString().split('T')[0];
            if (dailyActivity.has(dateStr)) {
              dailyActivity.set(dateStr, dailyActivity.get(dateStr) + 1);
            }
          }
        }
      });
    };

    addActivity(invoices, 'issueDate');
    addActivity(payments, 'date');
    addActivity(expenses, 'date');

    // Convert to contribution format
    return Array.from(dailyActivity.entries()).map(([dateStr, count]) => {
      let level = 0;
      if (count > 0) {
        if (count >= 4) level = 4;
        else if (count >= 3) level = 3;
        else if (count >= 2) level = 2;
        else level = 1;
      }
      return { date: dateStr, count, level };
    });
  }
};

module.exports = contributionService;
