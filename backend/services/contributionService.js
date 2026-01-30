const { collections } = require('../db');

const contributionService = {
  getContributions: async (userId, year = null) => {
    // Fetch real data from the database
    const [invoices, payments, expenses] = await Promise.all([
      collections.invoices.find({ userId }).toArray(),
      collections.payments.find({ userId }).toArray(),
      collections.expenses.find({ userId }).toArray()
    ]);

    const dailyActivity = new Map();
    let startDate, endDate;

    if (year && !isNaN(year)) {
      startDate = new Date(Date.UTC(year, 0, 1));
      endDate = new Date(Date.UTC(year, 11, 31));
    } else {
      // Default to trailing 12 months (Today backwards)
      // Use UTC midnight for today to avoid timezone shifting
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      endDate = new Date(todayStr + 'T00:00:00Z');

      startDate = new Date(endDate);
      startDate.setUTCFullYear(endDate.getUTCFullYear() - 1);
      startDate.setUTCDate(startDate.getUTCDate() + 1);
    }

    // Initialize all days in range using UTC
    for (let d = new Date(startDate); d <= endDate; d.setUTCDate(d.getUTCDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dailyActivity.set(dateStr, 0);
    }

    // Helper functions for common logic
    const addActivity = (items, dateField) => {
      items.forEach(item => {
        if (item[dateField]) {
          // DB dates are "YYYY-MM-DD", new Date("YYYY-MM-DD") creates UTC midnight
          const itemDate = new Date(item[dateField]);
          if (itemDate >= startDate && itemDate <= endDate) {
            const dateStr = itemDate.toISOString().split('T')[0];
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
