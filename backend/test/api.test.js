const http = require('http');
const { MongoClient, ObjectId } = require('mongodb');

// Test configuration
const TEST_PORT = 5003;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

// MongoDB connection for test cleanup
const testUri = 'mongodb://localhost:27017/freelance_tracker_test';
const testClient = new MongoClient(testUri);

let db;
let server;

// Helper function to make HTTP requests
const makeRequest = (path, method = 'GET', data = null) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: TEST_PORT,
            path: `/api${path}`,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                try {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: body ? JSON.parse(body) : null,
                    });
                } catch (err) {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: body,
                    });
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
};

// Test suite
async function runTests() {
    console.log('🧪 Starting API Tests...\n');

    // Wait a moment for the server to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
        // Test 1: Clients API
        console.log('📋 Testing Clients API...');

        // Create a client
        const newClient = {
            name: 'John Doe',
            email: 'john@example.com',
            phone: '123-456-7890',
            company: 'ABC Corp',
            address: '123 Main St'
        };

        const createClientRes = await makeRequest('/clients', 'POST', newClient);
        console.log(`✅ Create Client: ${createClientRes.statusCode === 201 ? 'PASS' : 'FAIL'} (${createClientRes.statusCode})`);

        if (createClientRes.body && createClientRes.body.id) {
            const clientId = createClientRes.body.id;

            // Get all clients
            const getClientsRes = await makeRequest('/clients');
            console.log(`✅ Get All Clients: ${getClientsRes.statusCode === 200 ? 'PASS' : 'FAIL'} (${getClientsRes.statusCode})`);

            // Get specific client
            const getClientRes = await makeRequest(`/clients/${clientId}`);
            console.log(`✅ Get Client: ${getClientRes.statusCode === 200 ? 'PASS' : 'FAIL'} (${getClientRes.statusCode})`);

            // Update client
            const updatedClient = {
                name: 'Jane Smith',
                email: 'jane@example.com',
                phone: '098-765-4321',
                company: 'XYZ Inc',
                address: '456 Oak Ave'
            };

            const updateClientRes = await makeRequest(`/clients/${clientId}`, 'PUT', updatedClient);
            console.log(`✅ Update Client: ${updateClientRes.statusCode === 200 ? 'PASS' : 'FAIL'} (${updateClientRes.statusCode})`);
        }

        console.log(''); // New line

        // Test 2: Projects API
        console.log('📁 Testing Projects API...');

        const newProject = {
            title: 'Website Redesign',
            description: 'Redesign client website',
            clientId: '60d5ec49a4c1560015b23c3e', // Using a dummy ID for now
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
            budget: 5000,
            status: 'active'
        };

        const createProjectRes = await makeRequest('/projects', 'POST', newProject);
        console.log(`✅ Create Project: ${createProjectRes.statusCode === 201 ? 'PASS' : 'FAIL'} (${createProjectRes.statusCode})`);

        // Get all projects
        const getProjectsRes = await makeRequest('/projects');
        console.log(`✅ Get All Projects: ${getProjectsRes.statusCode === 200 ? 'PASS' : 'FAIL'} (${getProjectsRes.statusCode})`);

        console.log(''); // New line

        // Test 3: Invoices API
        console.log('💰 Testing Invoices API...');

        const newInvoice = {
            projectId: '60d5ec49a4c1560015b23c3e', // Using a dummy ID for now
            clientId: '60d5ec49a4c1560015b23c3e', // Using a dummy ID for now
            invoiceNumber: 'INV-001',
            issueDate: new Date().toISOString(),
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
            items: [
                { description: 'Web Design', quantity: 10, price: 100, total: 1000 },
                { description: 'Development', quantity: 20, price: 75, total: 1500 }
            ],
            subtotal: 2500,
            taxRate: 8.5,
            taxAmount: 212.5,
            discount: 0,
            total: 2712.5,
            status: 'sent',
            notes: 'Thanks for your business!'
        };

        const createInvoiceRes = await makeRequest('/invoices', 'POST', newInvoice);
        console.log(`✅ Create Invoice: ${createInvoiceRes.statusCode === 201 ? 'PASS' : 'FAIL'} (${createInvoiceRes.statusCode})`);

        // Get all invoices
        const getInvoicesRes = await makeRequest('/invoices');
        console.log(`✅ Get All Invoices: ${getInvoicesRes.statusCode === 200 ? 'PASS' : 'FAIL'} (${getInvoicesRes.statusCode})`);

        console.log(''); // New line

        // Test 4: Payments API
        console.log('💳 Testing Payments API...');

        const newPayment = {
            invoiceId: '60d5ec49a4c1560015b23c3f', // Using a dummy ID for now
            amount: 1000,
            date: new Date().toISOString(),
            method: 'credit-card',
            notes: 'Partial payment'
        };

        const createPaymentRes = await makeRequest('/payments', 'POST', newPayment);
        console.log(`✅ Create Payment: ${createPaymentRes.statusCode === 201 ? 'PASS' : 'FAIL'} (${createPaymentRes.statusCode})`);

        // Get all payments
        const getPaymentsRes = await makeRequest('/payments');
        console.log(`✅ Get All Payments: ${getPaymentsRes.statusCode === 200 ? 'PASS' : 'FAIL'} (${getPaymentsRes.statusCode})`);

        console.log(''); // New line

        // Test 5: Expenses API
        console.log('📊 Testing Expenses API...');

        const newExpense = {
            description: 'Office supplies',
            category: 'office',
            amount: 150.75,
            date: new Date().toISOString(),
            projectId: '60d5ec49a4c1560015b23c3e', // Using a dummy ID for now
            notes: 'Pens, paper, notebooks'
        };

        const createExpenseRes = await makeRequest('/expenses', 'POST', newExpense);
        console.log(`✅ Create Expense: ${createExpenseRes.statusCode === 201 ? 'PASS' : 'FAIL'} (${createExpenseRes.statusCode})`);

        // Get all expenses
        const getExpensesRes = await makeRequest('/expenses');
        console.log(`✅ Get All Expenses: ${getExpensesRes.statusCode === 200 ? 'PASS' : 'FAIL'} (${getExpensesRes.statusCode})`);

        console.log(''); // New line

        console.log('🎉 All API tests completed!');

    } catch (error) {
        console.error('❌ Test Error:', error.message);
    } finally {
        // Close connections
        if (server) {
            server.close();
        }
        if (testClient) {
            await testClient.close();
        }
    }
}

// Start the test server and run tests
async function startTestServer() {
    const http = require('http');
    const url = require('url');
    const { MongoClient, ObjectId } = require('mongodb');
    require('dotenv').config({ path: '.env.test' });

    // MongoDB connection
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/freelance_tracker_test';
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
                }

                // Payments routes
                else if (path === '/api/payments' && method === 'GET') {
                    const payments = await paymentsCollection.find({}).toArray();
                    sendJsonResponse(res, 200, payments);
                } else if (path === '/api/payments' && method === 'POST') {
                    const body = await parseBody(req);
                    const result = await paymentsCollection.insertOne(body);
                    sendJsonResponse(res, 201, { id: result.insertedId, ...body });
                }

                // Expenses routes
                else if (path === '/api/expenses' && method === 'GET') {
                    const expenses = await expensesCollection.find({}).toArray();
                    sendJsonResponse(res, 200, expenses);
                } else if (path === '/api/expenses' && method === 'POST') {
                    const body = await parseBody(req);
                    const result = await expensesCollection.insertOne(body);
                    sendJsonResponse(res, 201, { id: result.insertedId, ...body });
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
            res.end('Freelance Invoice Tracking API Test Server');
        }
    };

    // Create HTTP server
    server = http.createServer(requestHandler);

    // Connect to MongoDB and start server
    try {
        await client.connect();
        console.log('Connected to MongoDB for testing');

        // Get database and collections
        db = client.db();
        clientsCollection = db.collection('clients');
        projectsCollection = db.collection('projects');
        invoicesCollection = db.collection('invoices');
        paymentsCollection = db.collection('payments');
        expensesCollection = db.collection('expenses');

        // Start the server
        const PORT = process.env.TEST_PORT || 5003;
        server.listen(PORT, async () => {
            console.log(`Test server running on port ${PORT}`);
            console.log(`Testing API at http://localhost:${PORT}/api/`);

            // Run tests after server starts
            await runTests();

            // Close the server after tests
            setTimeout(() => {
                server.close(() => {
                    console.log('Test server closed.');
                    client.close();
                });
            }, 5000); // Give some time for tests to finish
        });
    } catch (error) {
        console.error('Failed to connect to MongoDB for testing:', error);
        process.exit(1);
    }
}

// Start the test server
startTestServer();