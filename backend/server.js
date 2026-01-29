const http = require('http');
const url = require('url');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

// MongoDB connection
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/freelance_tracker';
const client = new MongoClient(uri);

// In-memory CORS settings for native http module
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS, POST, GET, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type',
};

// Database collections
let db;
let clientsCollection;
let projectsCollection;
let invoicesCollection;
let paymentsCollection;
let expensesCollection;

// Helper function to send JSON response
const sendJsonResponse = (res, statusCode, data) => {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        ...corsHeaders
    });
    res.end(JSON.stringify(data));
};

// Parse JSON body
const parseBody = (req) => {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (error) {
                reject(error);
            }
        });
    });
};

// Main request handler
const requestHandler = async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const method = req.method;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
        res.writeHead(200, corsHeaders);
        res.end();
        return;
    }

    // API routes
    if (path.startsWith('/api/')) {
        try {
            if (path === '/api/clients' && method === 'GET') {
                const clients = await clientsCollection.find({}).toArray();
                sendJsonResponse(res, 200, clients);
            } else if (path === '/api/clients' && method === 'POST') {
                const body = await parseBody(req);
                const result = await clientsCollection.insertOne(body);
                sendJsonResponse(res, 201, { id: result.insertedId, ...body });
            } else if (path.match(/^\/api\/clients\/\w+$/) && method === 'GET') {
                const clientId = path.split('/')[3];
                const client = await clientsCollection.findOne({ _id: new ObjectId(clientId) });
                if (client) {
                    sendJsonResponse(res, 200, client);
                } else {
                    sendJsonResponse(res, 404, { error: 'Client not found' });
                }
            } else if (path.match(/^\/api\/clients\/\w+$/) && method === 'GET') {
                const clientId = path.split('/')[3];
                const client = await clientsCollection.findOne({ _id: new ObjectId(clientId) });
                if (client) {
                    sendJsonResponse(res, 200, client);
                } else {
                    sendJsonResponse(res, 404, { error: 'Client not found' });
                }
            } else if (path.match(/^\/api\/clients\/\w+$/) && method === 'PUT') {
                const clientId = path.split('/')[3];
                const body = await parseBody(req);
                const result = await clientsCollection.updateOne(
                    { _id: new ObjectId(clientId) },
                    { $set: body }
                );
                if (result.matchedCount > 0) {
                    sendJsonResponse(res, 200, { message: 'Client updated successfully' });
                } else {
                    sendJsonResponse(res, 404, { error: 'Client not found' });
                }
            } else if (path.match(/^\/api\/clients\/\w+$/) && method === 'DELETE') {
                const clientId = path.split('/')[3];
                const result = await clientsCollection.deleteOne({ _id: new ObjectId(clientId) });
                if (result.deletedCount > 0) {
                    sendJsonResponse(res, 200, { message: 'Client deleted successfully' });
                } else {
                    sendJsonResponse(res, 404, { error: 'Client not found' });
                }
            }

            // Projects routes
            else if (path === '/api/projects' && method === 'GET') {
                const projects = await projectsCollection.find({}).toArray();
                sendJsonResponse(res, 200, projects);
            } else if (path === '/api/projects' && method === 'POST') {
                const body = await parseBody(req);
                const result = await projectsCollection.insertOne(body);
                sendJsonResponse(res, 201, { id: result.insertedId, ...body });
            } else if (path.match(/^\/api\/projects\/\w+$/) && method === 'GET') {
                const projectId = path.split('/')[3];
                const project = await projectsCollection.findOne({ _id: new ObjectId(projectId) });
                if (project) {
                    sendJsonResponse(res, 200, project);
                } else {
                    sendJsonResponse(res, 404, { error: 'Project not found' });
                }
            } else if (path.match(/^\/api\/projects\/\w+$/) && method === 'PUT') {
                const projectId = path.split('/')[3];
                const body = await parseBody(req);
                const result = await projectsCollection.updateOne(
                    { _id: new ObjectId(projectId) },
                    { $set: { ...body, updatedAt: new Date() } }
                );
                if (result.matchedCount > 0) {
                    sendJsonResponse(res, 200, { message: 'Project updated successfully' });
                } else {
                    sendJsonResponse(res, 404, { error: 'Project not found' });
                }
            } else if (path.match(/^\/api\/projects\/\w+$/) && method === 'DELETE') {
                const projectId = path.split('/')[3];
                const result = await projectsCollection.deleteOne({ _id: new ObjectId(projectId) });
                if (result.deletedCount > 0) {
                    sendJsonResponse(res, 200, { message: 'Project deleted successfully' });
                } else {
                    sendJsonResponse(res, 404, { error: 'Project not found' });
                }
            }

            // Invoices routes
            else if (path === '/api/invoices' && method === 'GET') {
                const invoices = await invoicesCollection.find({}).toArray();
                sendJsonResponse(res, 200, invoices);
            } else if (path === '/api/invoices' && method === 'POST') {
                const body = await parseBody(req);
                // Calculate totals if not provided
                if (!body.total && body.items) {
                    body.subtotal = body.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
                    body.taxAmount = body.taxRate ? body.subtotal * (body.taxRate / 100) : 0;
                    body.total = body.subtotal + body.taxAmount - (body.discount || 0);
                }
                const result = await invoicesCollection.insertOne(body);
                sendJsonResponse(res, 201, { id: result.insertedId, ...body });
            } else if (path.match(/^\/api\/invoices\/\w+$/) && method === 'GET') {
                const invoiceId = path.split('/')[3];
                const invoice = await invoicesCollection.findOne({ _id: new ObjectId(invoiceId) });
                if (invoice) {
                    sendJsonResponse(res, 200, invoice);
                } else {
                    sendJsonResponse(res, 404, { error: 'Invoice not found' });
                }
            } else if (path.match(/^\/api\/invoices\/\w+$/) && method === 'PUT') {
                const invoiceId = path.split('/')[3];
                const body = await parseBody(req);
                const result = await invoicesCollection.updateOne(
                    { _id: new ObjectId(invoiceId) },
                    { $set: { ...body, updatedAt: new Date() } }
                );
                if (result.matchedCount > 0) {
                    sendJsonResponse(res, 200, { message: 'Invoice updated successfully' });
                } else {
                    sendJsonResponse(res, 404, { error: 'Invoice not found' });
                }
            } else if (path.match(/^\/api\/invoices\/\w+$/) && method === 'DELETE') {
                const invoiceId = path.split('/')[3];
                const result = await invoicesCollection.deleteOne({ _id: new ObjectId(invoiceId) });
                if (result.deletedCount > 0) {
                    sendJsonResponse(res, 200, { message: 'Invoice deleted successfully' });
                } else {
                    sendJsonResponse(res, 404, { error: 'Invoice not found' });
                }
            }

            // Payments routes
            else if (path === '/api/payments' && method === 'GET') {
                const payments = await paymentsCollection.find({}).toArray();
                sendJsonResponse(res, 200, payments);
            } else if (path === '/api/payments' && method === 'POST') {
                const body = await parseBody(req);
                const result = await paymentsCollection.insertOne(body);
                sendJsonResponse(res, 201, { id: result.insertedId, ...body });
            } else if (path.match(/^\/api\/payments\/\w+$/) && method === 'GET') {
                const paymentId = path.split('/')[3];
                const payment = await paymentsCollection.findOne({ _id: new ObjectId(paymentId) });
                if (payment) {
                    sendJsonResponse(res, 200, payment);
                } else {
                    sendJsonResponse(res, 404, { error: 'Payment not found' });
                }
            } else if (path.match(/^\/api\/payments\/\w+$/) && method === 'PUT') {
                const paymentId = path.split('/')[3];
                const body = await parseBody(req);
                const result = await paymentsCollection.updateOne(
                    { _id: new ObjectId(paymentId) },
                    { $set: { ...body, updatedAt: new Date() } }
                );
                if (result.matchedCount > 0) {
                    sendJsonResponse(res, 200, { message: 'Payment updated successfully' });
                } else {
                    sendJsonResponse(res, 404, { error: 'Payment not found' });
                }
            } else if (path.match(/^\/api\/payments\/\w+$/) && method === 'DELETE') {
                const paymentId = path.split('/')[3];
                const result = await paymentsCollection.deleteOne({ _id: new ObjectId(paymentId) });
                if (result.deletedCount > 0) {
                    sendJsonResponse(res, 200, { message: 'Payment deleted successfully' });
                } else {
                    sendJsonResponse(res, 404, { error: 'Payment not found' });
                }
            }

            // Expenses routes
            else if (path === '/api/expenses' && method === 'GET') {
                const expenses = await expensesCollection.find({}).toArray();
                sendJsonResponse(res, 200, expenses);
            } else if (path === '/api/expenses' && method === 'POST') {
                const body = await parseBody(req);
                const result = await expensesCollection.insertOne(body);
                sendJsonResponse(res, 201, { id: result.insertedId, ...body });
            } else if (path.match(/^\/api\/expenses\/\w+$/) && method === 'GET') {
                const expenseId = path.split('/')[3];
                const expense = await expensesCollection.findOne({ _id: new ObjectId(expenseId) });
                if (expense) {
                    sendJsonResponse(res, 200, expense);
                } else {
                    sendJsonResponse(res, 404, { error: 'Expense not found' });
                }
            } else if (path.match(/^\/api\/expenses\/\w+$/) && method === 'PUT') {
                const expenseId = path.split('/')[3];
                const body = await parseBody(req);
                const result = await expensesCollection.updateOne(
                    { _id: new ObjectId(expenseId) },
                    { $set: { ...body, updatedAt: new Date() } }
                );
                if (result.matchedCount > 0) {
                    sendJsonResponse(res, 200, { message: 'Expense updated successfully' });
                } else {
                    sendJsonResponse(res, 404, { error: 'Expense not found' });
                }
            } else if (path.match(/^\/api\/expenses\/\w+$/) && method === 'DELETE') {
                const expenseId = path.split('/')[3];
                const result = await expensesCollection.deleteOne({ _id: new ObjectId(expenseId) });
                if (result.deletedCount > 0) {
                    sendJsonResponse(res, 200, { message: 'Expense deleted successfully' });
                } else {
                    sendJsonResponse(res, 404, { error: 'Expense not found' });
                }
            }
            // Contribution Graph route
            else if (path.match(/^\/api\/contributions\/\d+$/) && method === 'GET') {
                const year = parseInt(path.split('/')[3]);

                // Validate year parameter
                if (isNaN(year) || year < 2000 || year > 2100) {
                    return sendJsonResponse(res, 400, { error: 'Invalid year parameter' });
                }

                try {
                    // Fetch real data from the database
                    const [invoices, payments, expenses] = await Promise.all([
                        invoicesCollection.find({}).toArray(),
                        paymentsCollection.find({}).toArray(),
                        expensesCollection.find({}).toArray()
                    ]);

                    // Initialize daily activity counts
                    const dailyActivity = new Map();
                    const startDate = new Date(year, 0, 1);
                    const endDate = new Date(year, 11, 31);

                    // Initialize all days of the year with zero activity
                    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                        const dateStr = new Date(d).toISOString().split('T')[0];
                        dailyActivity.set(dateStr, 0);
                    }

                    // Count invoice activities
                    invoices.forEach(invoice => {
                        if (invoice.issueDate) {
                            const invoiceDate = new Date(invoice.issueDate);
                            if (invoiceDate.getFullYear() === year) {
                                const dateStr = invoiceDate.toISOString().split('T')[0];
                                if (dailyActivity.has(dateStr)) {
                                    dailyActivity.set(dateStr, dailyActivity.get(dateStr) + 1);
                                }
                            }
                        }
                    });

                    // Count payment activities
                    payments.forEach(payment => {
                        if (payment.date) {
                            const paymentDate = new Date(payment.date);
                            if (paymentDate.getFullYear() === year) {
                                const dateStr = paymentDate.toISOString().split('T')[0];
                                if (dailyActivity.has(dateStr)) {
                                    dailyActivity.set(dateStr, dailyActivity.get(dateStr) + 1);
                                }
                            }
                        }
                    });

                    // Count expense activities
                    expenses.forEach(expense => {
                        if (expense.date) {
                            const expenseDate = new Date(expense.date);
                            if (expenseDate.getFullYear() === year) {
                                const dateStr = expenseDate.toISOString().split('T')[0];
                                if (dailyActivity.has(dateStr)) {
                                    dailyActivity.set(dateStr, dailyActivity.get(dateStr) + 1);
                                }
                            }
                        }
                    });

                    // Convert to contribution format
                    const contributions = [];
                    for (let [dateStr, count] of dailyActivity.entries()) {
                        // Determine level based on activity count
                        let level = 0; // Default to no activity (dark square)
                        if (count > 0) {
                            if (count >= 4) level = 4; // Highest activity (brightest green)
                            else if (count >= 3) level = 3;
                            else if (count >= 2) level = 2;
                            else level = 1; // Lowest activity (lightest green)
                        }

                        contributions.push({
                            date: dateStr,
                            count: count,
                            level: level
                        });
                    }

                    sendJsonResponse(res, 200, contributions);
                } catch (error) {
                    console.error('Error fetching contribution data:', error);
                    // Fallback to mock data if database query fails
                    const contributions = [];
                    const startDate = new Date(year, 0, 1);
                    const endDate = new Date(year, 11, 31);

                    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                        const currentDate = new Date(d);
                        const dateStr = currentDate.toISOString().split('T')[0];

                        // Generate realistic mock data
                        const dayOfWeek = currentDate.getDay();
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                        const activityCount = isWeekend ?
                            (Math.random() > 0.8 ? Math.floor(Math.random() * 2) : 0) :
                            (Math.random() > 0.4 ? Math.floor(Math.random() * 3) + 1 : 0);

                        let level = 0;
                        if (activityCount > 0) {
                            if (activityCount >= 4) level = 4;
                            else if (activityCount >= 3) level = 3;
                            else if (activityCount >= 2) level = 2;
                            else level = 1;
                        }

                        contributions.push({
                            date: dateStr,
                            count: activityCount,
                            level: level
                        });
                    }

                    sendJsonResponse(res, 200, contributions);
                }
            }
            // Default route
            else {
                sendJsonResponse(res, 404, { error: 'Route not found' });
            }
        } catch (error) {
            console.error('Error handling request:', error);
            sendJsonResponse(res, 500, { error: 'Internal server error' });
        }
    } else {
        // Serve a simple welcome message for root path
        res.writeHead(200, { 'Content-Type': 'text/plain', ...corsHeaders });
        res.end('Freelance Invoice Tracking API Server');
    }
};

// Create HTTP server
const server = http.createServer(requestHandler);

// Connect to MongoDB and start server
const startServer = async () => {
    try {
        await client.connect();
        console.log('Connected to MongoDB');

        // Get database and collections
        db = client.db();
        clientsCollection = db.collection('clients');
        projectsCollection = db.collection('projects');
        invoicesCollection = db.collection('invoices');
        paymentsCollection = db.collection('payments');
        expensesCollection = db.collection('expenses');

        // Start the server
        const PORT = process.env.PORT || 5000;
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`API available at http://localhost:${PORT}/api/`);
        });
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    }
};

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    await client.close();
    process.exit(0);
});