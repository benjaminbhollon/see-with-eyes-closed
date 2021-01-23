const { MongoClient } = require('mongodb'); // Import MongoDB
const config = require('../config.json');

// Create document
exports.insertDocument = async function insertDocument(collection, value) {
  const uri = config.mongodbURI;

  const client = new MongoClient(uri, { useUnifiedTopology: true });

  try {
    // Connect to the MongoDB cluster
    await client.connect();

    // Insert document
    await client.db('swec-core').collection(collection).insertOne(value);
  } catch (e) {
    console.error(e);
    return false;
  } finally {
    await client.close();
  }

  return true;
};

// Read document
exports.findDocument = async function findDocument(collection, filter) {
  const uri = config.mongodbURI;

  const client = new MongoClient(uri, { useUnifiedTopology: true });

  try {
    // Connect to the MongoDB cluster
    await client.connect();

    // Find document
    await client.db('swec-core').collection(collection).findOne(filter);
  } catch (e) {
    console.error(e);
    return false;
  } finally {
    await client.close();
  }

  return true;
};

// Read multiple documents
exports.findMultipleDocuments = async function findMultipleDocuments(collection, filter) {
  const uri = config.mongodbURI;

  const client = new MongoClient(uri, { useUnifiedTopology: true });

  try {
    // Connect to the MongoDB cluster
    await client.connect();

    // Find documents
    await client.db('swec-core').collection(collection).find(filter).toArray();
  } catch (e) {
    console.error(e);
    return false;
  } finally {
    await client.close();
  }

  return true;
};

// Update document
exports.updateDocument = async function updateDocument(collection, filter, set) {
  const uri = config.mongodbURI;

  const client = new MongoClient(uri, { useUnifiedTopology: true });

  try {
    // Connect to the MongoDB cluster
    await client.connect();

    // Update document
    await client.db('swec-core').collection(collection).updateOne(filter, { $set: set });
  } catch (e) {
    console.error(e);
    return false;
  } finally {
    await client.close();
  }

  return true;
};

// Update multiple documents
exports.updateMultipleDocuments = async function updateMultipleDocuments(collection, filter, set) {
  const uri = config.mongodbURI;

  const client = new MongoClient(uri, { useUnifiedTopology: true });

  try {
    // Connect to the MongoDB cluster
    await client.connect();

    // Update document
    await client.db('swec-core').collection(collection).updateMany(filter, { $set: set });
  } catch (e) {
    console.error(e);
    return false;
  } finally {
    await client.close();
  }

  return true;
};

// Delete document
exports.deleteDocument = async function deleteDocument(collection, filter) {
  const uri = config.mongodbURI;

  const client = new MongoClient(uri, { useUnifiedTopology: true });

  try {
    // Connect to the MongoDB cluster
    await client.connect();

    // Delete document
    await client.db('swec-core').collection(collection).deleteOne(filter);
  } catch (e) {
    console.error(e);
    return false;
  } finally {
    await client.close();
  }

  return true;
};

// Delete multiple documents
exports.deleteMultipleDocuments = async function deleteMultipleDocuments(collection, filter) {
  const uri = config.mongodbURI;

  const client = new MongoClient(uri, { useUnifiedTopology: true });

  try {
    // Connect to the MongoDB cluster
    await client.connect();

    // Find document
    await client.db('swec-core').collection(collection).deleteMany(filter);
  } catch (e) {
    console.error(e);
    return false;
  } finally {
    await client.close();
  }

  return true;
};
