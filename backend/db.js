const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/freelance_tracker';
const client = new MongoClient(uri);

let db;
const collections = {};

async function connectToDatabase() {
  if (db) return collections;

  try {
    await client.connect();
    console.log('Connected to MongoDB');
    db = client.db();
    
    collections.clients = db.collection('clients');
    collections.projects = db.collection('projects');
    collections.invoices = db.collection('invoices');
    collections.payments = db.collection('payments');
    collections.expenses = db.collection('expenses');
    collections.users = db.collection('users');

    // Create indexes for multitenancy
    await collections.clients.createIndex({ userId: 1 });
    await collections.projects.createIndex({ userId: 1 });
    await collections.invoices.createIndex({ userId: 1 });
    await collections.payments.createIndex({ userId: 1 });
    await collections.expenses.createIndex({ userId: 1 });
    await collections.users.createIndex({ email: 1 }, { unique: true });

    return collections;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

module.exports = { connectToDatabase, collections };
