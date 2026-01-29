/**
 * Quick test to verify all API endpoints are working
 */

const http = require('http');

const SERVER_URL = 'localhost';
const SERVER_PORT = process.env.TEST_PORT || 5003;

// Simple request helper with timeout
function makeRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: SERVER_URL,
            port: SERVER_PORT,
            path: `/api${path}`,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 5000 // 5 second timeout
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: body ? JSON.parse(body) : null });
                } catch (e) {
                    resolve({ status: res.statusCode, body: body });
                }
            });
        });

        req.on('error', (err) => reject(err));

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timed out'));
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function runQuickTests() {
    console.log('⚡ Running quick API endpoint tests...\n');

    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test all GET endpoints
    const endpoints = [
        { path: '/clients', desc: 'Get all clients' },
        { path: '/projects', desc: 'Get all projects' },
        { path: '/invoices', desc: 'Get all invoices' },
        { path: '/payments', desc: 'Get all payments' },
        { path: '/expenses', desc: 'Get all expenses' }
    ];

    for (const endpoint of endpoints) {
        try {
            const result = await makeRequest(endpoint.path);
            console.log(`${result.status === 200 ? '✅' : '❌'} ${endpoint.desc}: ${result.status}`);
        } catch (error) {
            console.log(`❌ ${endpoint.desc}: Error - ${error.message}`);
        }
    }

    console.log('\n🧪 Testing POST endpoints with sample data...');

    // Test POST endpoints with minimal data
    const testData = {
        clients: { name: 'Test Client', email: 'test@example.com' },
        projects: { title: 'Test Project', clientId: '123456789012345678901234', status: 'active' },
        invoices: {
            invoiceNumber: 'TEST-001',
            clientId: '123456789012345678901234',
            projectId: '123456789012345678901234',
            issueDate: new Date().toISOString(),
            dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            items: [{ description: 'Test', quantity: 1, price: 100, total: 100 }],
            total: 100,
            status: 'draft'
        },
        payments: {
            invoiceId: '123456789012345678901234',
            amount: 100,
            date: new Date().toISOString(),
            method: 'cash'
        },
        expenses: {
            description: 'Test Expense',
            category: 'office',
            amount: 50,
            date: new Date().toISOString()
        }
    };

    for (const [entity, data] of Object.entries(testData)) {
        try {
            const result = await makeRequest(`/${entity}`, 'POST', data);
            console.log(`${result.status === 201 ? '✅' : '❌'} Create ${entity}: ${result.status}`);
        } catch (error) {
            console.log(`❌ Create ${entity}: Error - ${error.message}`);
        }
    }

    console.log('\n🎯 Quick test completed!');
}

runQuickTests().catch(console.error);