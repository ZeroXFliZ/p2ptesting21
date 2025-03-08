import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
};

let client;
let clientPromise;

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

// Helper functions for database operations
export async function getItemsCollection() {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || 'p2p-marketplace');
  return db.collection('items');
}

export async function getAllItems(query = {}) {
  const collection = await getItemsCollection();
  return collection.find(query).toArray();
}

export async function getItemById(id) {
  const collection = await getItemsCollection();
  return collection.findOne({ itemId: parseInt(id) });
}

export async function createItem(item) {
  const collection = await getItemsCollection();
  return collection.insertOne(item);
}

export async function updateItem(id, updates) {
  const collection = await getItemsCollection();
  return collection.updateOne(
    { itemId: parseInt(id) },
    { $set: updates }
  );
}

export async function deleteItem(id) {
  const collection = await getItemsCollection();
  return collection.deleteOne({ itemId: parseInt(id) });
}

export async function searchItems(query) {
  const collection = await getItemsCollection();
  return collection.find({
    name: { $regex: query, $options: 'i' }
  }).toArray();
}