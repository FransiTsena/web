const http = require('http');
const url = require('url');
const { connectToDatabase } = require('./db');
const clientService = require('./services/clientService');
const projectService = require('./services/projectService');
const invoiceService = require('./services/invoiceService');
const paymentService = require('./services/paymentService');
const expenseService = require('./services/expenseService');
const contributionService = require('./services/contributionService');
const aiChatService = require('./services/ai/aiChatService');
const aiActionService = require('./services/ai/aiActionService');

// CORS settings
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS, POST, GET, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type',
};

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

    if (method === 'OPTIONS') {
        res.writeHead(200, corsHeaders);
        res.end();
        return;
    }

    if (path.startsWith('/api/')) {
        try {
            const pathParts = path.split('/').filter(Boolean); // ['', 'api', 'resource', 'id'] -> ['api', 'resource', 'id']
            const resource = pathParts[1];
            const id = pathParts[2];

            // Client Routes
            if (resource === 'clients') {
                if (method === 'GET') {
                    if (id) {
                        const client = await clientService.getById(id);
                        client ? sendJsonResponse(res, 200, client) : sendJsonResponse(res, 404, { error: 'Client not found' });
                    } else {
                        const clients = await clientService.getAll();
                        sendJsonResponse(res, 200, clients);
                    }
                } else if (method === 'POST') {
                    const body = await parseBody(req);
                    const newClient = await clientService.create(body);
                    sendJsonResponse(res, 201, newClient);
                } else if (method === 'PUT' && id) {
                    const body = await parseBody(req);
                    const success = await clientService.update(id, body);
                    success ? sendJsonResponse(res, 200, { message: 'Updated' }) : sendJsonResponse(res, 404, { error: 'Not found' });
                } else if (method === 'DELETE' && id) {
                    const success = await clientService.delete(id);
                    success ? sendJsonResponse(res, 200, { message: 'Deleted' }) : sendJsonResponse(res, 404, { error: 'Not found' });
                }
            }

            // Project Routes
            else if (resource === 'projects') {
                if (method === 'GET') {
                    if (id) {
                        const project = await projectService.getById(id);
                        project ? sendJsonResponse(res, 200, project) : sendJsonResponse(res, 404, { error: 'Project not found' });
                    } else {
                        const projects = await projectService.getAll();
                        sendJsonResponse(res, 200, projects);
                    }
                } else if (method === 'POST') {
                    const body = await parseBody(req);
                    const newProject = await projectService.create(body);
                    sendJsonResponse(res, 201, newProject);
                } else if (method === 'PUT' && id) {
                    const body = await parseBody(req);
                    const success = await projectService.update(id, body);
                    success ? sendJsonResponse(res, 200, { message: 'Updated' }) : sendJsonResponse(res, 404, { error: 'Not found' });
                } else if (method === 'DELETE' && id) {
                    const success = await projectService.delete(id);
                    success ? sendJsonResponse(res, 200, { message: 'Deleted' }) : sendJsonResponse(res, 404, { error: 'Not found' });
                }
            }

            // Invoice Routes
            else if (resource === 'invoices') {
                if (method === 'GET') {
                    if (id) {
                        const invoice = await invoiceService.getById(id);
                        invoice ? sendJsonResponse(res, 200, invoice) : sendJsonResponse(res, 404, { error: 'Invoice not found' });
                    } else {
                        const invoices = await invoiceService.getAll();
                        sendJsonResponse(res, 200, invoices);
                    }
                } else if (method === 'POST') {
                    const body = await parseBody(req);
                    const newInvoice = await invoiceService.create(body);
                    sendJsonResponse(res, 201, newInvoice);
                } else if (method === 'PUT' && id) {
                    const body = await parseBody(req);
                    const success = await invoiceService.update(id, body);
                    success ? sendJsonResponse(res, 200, { message: 'Updated' }) : sendJsonResponse(res, 404, { error: 'Not found' });
                } else if (method === 'DELETE' && id) {
                    const success = await invoiceService.delete(id);
                    success ? sendJsonResponse(res, 200, { message: 'Deleted' }) : sendJsonResponse(res, 404, { error: 'Not found' });
                }
            }

            // Payment Routes
            else if (resource === 'payments') {
                if (method === 'GET') {
                    if (id) {
                        const payment = await paymentService.getById(id);
                        payment ? sendJsonResponse(res, 200, payment) : sendJsonResponse(res, 404, { error: 'Payment not found' });
                    } else {
                        const payments = await paymentService.getAll();
                        sendJsonResponse(res, 200, payments);
                    }
                } else if (method === 'POST') {
                    const body = await parseBody(req);
                    const newPayment = await paymentService.create(body);
                    sendJsonResponse(res, 201, newPayment);
                } else if (method === 'PUT' && id) {
                    const body = await parseBody(req);
                    const success = await paymentService.update(id, body);
                    success ? sendJsonResponse(res, 200, { message: 'Updated' }) : sendJsonResponse(res, 404, { error: 'Not found' });
                } else if (method === 'DELETE' && id) {
                    const success = await paymentService.delete(id);
                    success ? sendJsonResponse(res, 200, { message: 'Deleted' }) : sendJsonResponse(res, 404, { error: 'Not found' });
                }
            }

            // Expense Routes
            else if (resource === 'expenses') {
                if (method === 'GET') {
                    if (id) {
                        const expense = await expenseService.getById(id);
                        expense ? sendJsonResponse(res, 200, expense) : sendJsonResponse(res, 404, { error: 'Expense not found' });
                    } else {
                        const expenses = await expenseService.getAll();
                        sendJsonResponse(res, 200, expenses);
                    }
                } else if (method === 'POST') {
                    const body = await parseBody(req);
                    const newExpense = await expenseService.create(body);
                    sendJsonResponse(res, 201, newExpense);
                } else if (method === 'PUT' && id) {
                    const body = await parseBody(req);
                    const success = await expenseService.update(id, body);
                    success ? sendJsonResponse(res, 200, { message: 'Updated' }) : sendJsonResponse(res, 404, { error: 'Not found' });
                } else if (method === 'DELETE' && id) {
                    const success = await expenseService.delete(id);
                    success ? sendJsonResponse(res, 200, { message: 'Deleted' }) : sendJsonResponse(res, 404, { error: 'Not found' });
                }
            }

            // Contribution Routes
            else if (resource === 'contributions') {
                if (method === 'GET' && id) {
                    const year = parseInt(id);
                    if (isNaN(year)) return sendJsonResponse(res, 400, { error: 'Invalid year' });
                    const contributions = await contributionService.getYearlyContributions(year);
                    sendJsonResponse(res, 200, contributions);
                }
            }

            // AI Routes
            else if (resource === 'ai') {
                if (method === 'POST') {
                    const body = await parseBody(req);
                    if (pathParts[2] === 'chat') {
                        const response = await aiChatService.processChat(body.message, body.history);
                        sendJsonResponse(res, 200, response);
                    } else if (pathParts[2] === 'execute') {
                        const result = await aiActionService.executeAction(body.type, body.data);
                        sendJsonResponse(res, 200, result);
                    }
                }
            }

            else {
                sendJsonResponse(res, 404, { error: 'Route not found' });
            }
        } catch (error) {
            console.error('Error handling request:', error);
            sendJsonResponse(res, 500, { error: 'Internal server error' });
        }
    } else {
        res.writeHead(200, { 'Content-Type': 'text/plain', ...corsHeaders });
        res.end('Freelance Invoice Tracking API Server');
    }
};

const server = http.createServer(requestHandler);

const startServer = async () => {
    try {
        await connectToDatabase();
        const PORT = process.env.PORT || 5000;
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

process.on('SIGINT', () => {
    process.exit(0);
});
