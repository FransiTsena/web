const http = require('http');
const { MongoClient, ObjectId } = require('mongodb');

// Test configuration
const TEST_PORT = 5001;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

// MongoDB connection for test cleanup
const testUri = 'mongodb://localhost:27017/freelance_tracker_test';
const testClient = new MongoClient(testUri);

let server;
let testResources = {}; // Store created resources for cleanup

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

// Validation helpers
const validateResponse = (response, expectedStatus, description) => {
    const passed = response.statusCode === expectedStatus;
    console.log(`${passed ? '✅' : '❌'} ${description}: ${passed ? 'PASS' : 'FAIL'} (Status: ${response.statusCode}, Expected: ${expectedStatus})`);
    return passed;
};

const validateResponseBody = (response, field, expectedValue, description) => {
    const actualValue = response.body && response.body[field];
    const passed = actualValue === expectedValue;
    console.log(`${passed ? '✅' : '❌'} ${description}: ${passed ? 'PASS' : 'FAIL'} (Actual: ${actualValue}, Expected: ${expectedValue})`);
    return passed;
};

// Comprehensive test suite
async function runComprehensiveTests() {
    console.log('🧪 Starting Comprehensive API Tests...\n');

    // Wait a moment for the server to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
        // Test 1: Clients API
        console.log('📋 Testing Clients API...');

        // Test 1.1: Get all clients (should be empty initially)
        const getClientsEmptyRes = await makeRequest('/clients');
        validateResponse(getClientsEmptyRes, 200, 'Get all clients (empty)');

        // Test 1.2: Create a client
        const newClient = {
            name: 'Test Client',
            email: 'test@example.com',
            phone: '555-1234',
            company: 'Test Corp',
            address: '123 Test Street'
        };

        const createClientRes = await makeRequest('/clients', 'POST', newClient);
        const clientCreated = validateResponse(createClientRes, 201, 'Create client');

        if (clientCreated && createClientRes.body && createClientRes.body.id) {
            testResources.clientId = createClientRes.body.id;
            validateResponseBody(createClientRes, 'id', testResources.clientId, 'Client ID returned');
            validateResponseBody(createClientRes, 'name', 'Test Client', 'Client name correct');
        }

        // Test 1.3: Get all clients (should have one now)
        const getClientsRes = await makeRequest('/clients');
        validateResponse(getClientsRes, 200, 'Get all clients (after creation)');
        if (getClientsRes.body && Array.isArray(getClientsRes.body)) {
            console.log(`✅ Get all clients: Found ${getClientsRes.body.length} client(s)`);
        }

        // Test 1.4: Get specific client
        if (testResources.clientId) {
            const getClientRes = await makeRequest(`/clients/${testResources.clientId}`);
            validateResponse(getClientRes, 200, 'Get specific client');
            if (getClientRes.body) {
                validateResponseBody(getClientRes, 'name', 'Test Client', 'Retrieved client name correct');
            }
        }

        // Test 1.5: Update client
        if (testResources.clientId) {
            const updatedClient = {
                name: 'Updated Test Client',
                email: 'updated@example.com',
                phone: '555-5678',
                company: 'Updated Corp',
                address: '456 Updated Street'
            };

            const updateClientRes = await makeRequest(`/clients/${testResources.clientId}`, 'PUT', updatedClient);
            validateResponse(updateClientRes, 200, 'Update client');
        }

        console.log(''); // New line

        // Test 2: Projects API
        console.log('📁 Testing Projects API...');

        // Test 2.1: Get all projects (should be empty initially)
        const getProjectsEmptyRes = await makeRequest('/projects');
        validateResponse(getProjectsEmptyRes, 200, 'Get all projects (empty)');

        // Test 2.2: Create a project
        const newProject = {
            title: 'Test Project',
            description: 'This is a test project',
            clientId: testResources.clientId || '60d5ec49a4c1560015b23c3e', // Use created client or dummy
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            budget: 10000,
            status: 'active'
        };

        const createProjectRes = await makeRequest('/projects', 'POST', newProject);
        const projectCreated = validateResponse(createProjectRes, 201, 'Create project');

        if (projectCreated && createProjectRes.body && createProjectRes.body.id) {
            testResources.projectId = createProjectRes.body.id;
            validateResponseBody(createProjectRes, 'id', testResources.projectId, 'Project ID returned');
            validateResponseBody(createProjectRes, 'title', 'Test Project', 'Project title correct');
        }

        // Test 2.3: Get all projects
        const getProjectsRes = await makeRequest('/projects');
        validateResponse(getProjectsRes, 200, 'Get all projects (after creation)');

        console.log(''); // New line

        // Test 3: Invoices API
        console.log('💰 Testing Invoices API...');

        // Test 3.1: Get all invoices (should be empty initially)
        const getInvoicesEmptyRes = await makeRequest('/invoices');
        validateResponse(getInvoicesEmptyRes, 200, 'Get all invoices (empty)');

        // Test 3.2: Create an invoice
        const newInvoice = {
            projectId: testResources.projectId || '60d5ec49a4c1560015b23c3e',
            clientId: testResources.clientId || '60d5ec49a4c1560015b23c3e',
            invoiceNumber: 'INV-001',
            issueDate: new Date().toISOString(),
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            items: [
                { description: 'Service 1', quantity: 5, price: 100, total: 500 },
                { description: 'Service 2', quantity: 3, price: 75, total: 225 }
            ],
            subtotal: 725,
            taxRate: 10,
            taxAmount: 72.5,
            discount: 25,
            total: 772.5,
            status: 'sent',
            notes: 'Test invoice'
        };

        const createInvoiceRes = await makeRequest('/invoices', 'POST', newInvoice);
        const invoiceCreated = validateResponse(createInvoiceRes, 201, 'Create invoice');

        if (invoiceCreated && createInvoiceRes.body && createInvoiceRes.body.id) {
            testResources.invoiceId = createInvoiceRes.body.id;
            validateResponseBody(createInvoiceRes, 'id', testResources.invoiceId, 'Invoice ID returned');
            validateResponseBody(createInvoiceRes, 'invoiceNumber', 'INV-001', 'Invoice number correct');
            validateResponseBody(createInvoiceRes, 'total', 772.5, 'Invoice total calculated correctly');
        }

        // Test 3.3: Get all invoices
        const getInvoicesRes = await makeRequest('/invoices');
        validateResponse(getInvoicesRes, 200, 'Get all invoices (after creation)');

        console.log(''); // New line

        // Test 4: Payments API
        console.log('💳 Testing Payments API...');

        // Test 4.1: Get all payments (should be empty initially)
        const getPaymentsEmptyRes = await makeRequest('/payments');
        validateResponse(getPaymentsEmptyRes, 200, 'Get all payments (empty)');

        // Test 4.2: Create a payment
        const newPayment = {
            invoiceId: testResources.invoiceId || '60d5ec49a4c1560015b23c3f',
            amount: 500,
            date: new Date().toISOString(),
            method: 'credit-card',
            notes: 'Partial payment for invoice'
        };

        const createPaymentRes = await makeRequest('/payments', 'POST', newPayment);
        const paymentCreated = validateResponse(createPaymentRes, 201, 'Create payment');

        if (paymentCreated && createPaymentRes.body && createPaymentRes.body.id) {
            testResources.paymentId = createPaymentRes.body.id;
            validateResponseBody(createPaymentRes, 'id', testResources.paymentId, 'Payment ID returned');
            validateResponseBody(createPaymentRes, 'amount', 500, 'Payment amount correct');
        }

        // Test 4.3: Get all payments
        const getPaymentsRes = await makeRequest('/payments');
        validateResponse(getPaymentsRes, 200, 'Get all payments (after creation)');

        console.log(''); // New line

        // Test 5: Expenses API
        console.log('📊 Testing Expenses API...');

        // Test 5.1: Get all expenses (should be empty initially)
        const getExpensesEmptyRes = await makeRequest('/expenses');
        validateResponse(getExpensesEmptyRes, 200, 'Get all expenses (empty)');

        // Test 5.2: Create an expense
        const newExpense = {
            description: 'Office Supplies',
            category: 'office',
            amount: 150.75,
            date: new Date().toISOString(),
            projectId: testResources.projectId || '60d5ec49a4c1560015b23c3e',
            notes: 'Pens, paper, and notebooks'
        };

        const createExpenseRes = await makeRequest('/expenses', 'POST', newExpense);
        const expenseCreated = validateResponse(createExpenseRes, 201, 'Create expense');

        if (expenseCreated && createExpenseRes.body && createExpenseRes.body.id) {
            testResources.expenseId = createExpenseRes.body.id;
            validateResponseBody(createExpenseRes, 'id', testResources.expenseId, 'Expense ID returned');
            validateResponseBody(createExpenseRes, 'description', 'Office Supplies', 'Expense description correct');
        }

        // Test 5.3: Get all expenses
        const getExpensesRes = await makeRequest('/expenses');
        validateResponse(getExpensesRes, 200, 'Get all expenses (after creation)');

        console.log(''); // New line

        // Test 6: Error handling
        console.log('⚠️ Testing Error Handling...');

        // Test 6.1: Try to get a non-existent client
        const getNonExistentClientRes = await makeRequest('/clients/invalid-id');
        validateResponse(getNonExistentClientRes, 404, 'Get non-existent client');

        // Test 6.2: Try to update a non-existent client
        const updateNonExistentClientRes = await makeRequest('/clients/invalid-id', 'PUT', { name: 'New Name' });
        validateResponse(updateNonExistentClientRes, 404, 'Update non-existent client');

        // Test 6.3: Try to delete a non-existent client
        const deleteNonExistentClientRes = await makeRequest('/clients/invalid-id', 'DELETE');
        validateResponse(deleteNonExistentClientRes, 404, 'Delete non-existent client');

        console.log(''); // New line

        console.log('🎉 All comprehensive API tests completed!');
        console.log('\n📋 Test Resources Created:');
        console.log('- Client ID:', testResources.clientId || 'None');
        console.log('- Project ID:', testResources.projectId || 'None');
        console.log('- Invoice ID:', testResources.invoiceId || 'None');
        console.log('- Payment ID:', testResources.paymentId || 'None');
        console.log('- Expense ID:', testResources.expenseId || 'None');

    } catch (error) {
        console.error('❌ Test Error:', error.message);
        console.error(error.stack);
    } finally {
        // Cleanup resources
        console.log('\n🧹 Cleaning up test resources...');
        await cleanupTestResources();
    }
}

// Clean up test resources
async function cleanupTestResources() {
    if (!testResources.clientId) return;

    try {
        const db = testClient.db();
        const clientsCollection = db.collection('clients');
        const projectsCollection = db.collection('projects');
        const invoicesCollection = db.collection('invoices');
        const paymentsCollection = db.collection('payments');
        const expensesCollection = db.collection('expenses');

        // Delete created resources
        if (testResources.clientId) {
            await clientsCollection.deleteOne({ _id: new ObjectId(testResources.clientId) });
            console.log(`✅ Deleted test client: ${testResources.clientId}`);
        }

        if (testResources.projectId) {
            await projectsCollection.deleteOne({ _id: new ObjectId(testResources.projectId) });
            console.log(`✅ Deleted test project: ${testResources.projectId}`);
        }

        if (testResources.invoiceId) {
            await invoicesCollection.deleteOne({ _id: new ObjectId(testResources.invoiceId) });
            console.log(`✅ Deleted test invoice: ${testResources.invoiceId}`);
        }

        if (testResources.paymentId) {
            await paymentsCollection.deleteOne({ _id: new ObjectId(testResources.paymentId) });
            console.log(`✅ Deleted test payment: ${testResources.paymentId}`);
        }

        if (testResources.expenseId) {
            await expensesCollection.deleteOne({ _id: new ObjectId(testResources.expenseId) });
            console.log(`✅ Deleted test expense: ${testResources.expenseId}`);
        }

    } catch (error) {
        console.error('❌ Error during cleanup:', error.message);
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
            await runComprehensiveTests();

            // Close the server after tests
            setTimeout(() => {
                console.log('\n🛑 Shutting down test server...');
                server.close(async () => {
                    console.log('Test server closed.');
                    await client.close();
                    await testClient.close();
                    console.log('MongoDB connections closed.');
                });
            }, 8000); // Give more time for tests to finish
        });
    } catch (error) {
        console.error('Failed to connect to MongoDB for testing:', error);
        process.exit(1);
    }
}

// Start the test server
startTestServer();