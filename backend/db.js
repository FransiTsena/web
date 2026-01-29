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

    return collections;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

module.exports = { connectToDatabase, collections };
