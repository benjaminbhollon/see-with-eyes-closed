const { MongoClient } = require('mongodb'); // Import MongoDB
const config = require('../config.json');

// Create document
exports.insertDocument = async function (collection, value) {
  const uri = config.mongodbURI;

  const client = new MongoClient(uri, { useUnifiedTopology: true });

  try {
    // Connect to the MongoDB cluster
    await client.connect();

    // Insert document
    return await client.db('swec-core').collection(collection).insertOne(value);
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
};

// Read document
exports.findDocument = async function (collection, filter) {
  const uri = config.mongodbURI;

  const client = new MongoClient(uri, { useUnifiedTopology: true });

  try {
    // Connect to the MongoDB cluster
    await client.connect();

    // Find document
    return await client.db('swec-core').collection(collection).findOne(filter);
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
};

// Read multiple documents
exports.findMultipleDocuments = async function (collection, filter) {
  const uri = config.mongodbURI;

  const client = new MongoClient(uri, { useUnifiedTopology: true });

  try {
    // Connect to the MongoDB cluster
    await client.connect();

    // Find documents
    return await client.db('swec-core').collection(collection).find(filter).toArray();
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
};

// Update document
exports.updateDocument = async function (collection, filter, set) {
  const uri = config.mongodbURI;

  const client = new MongoClient(uri, { useUnifiedTopology: true });

  try {
    // Connect to the MongoDB cluster
    await client.connect();

    // Update document
    return await client.db('swec-core').collection(collection).updateOne(filter, { $set: set });
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
};

// Update multiple documents
exports.updateMultipleDocuments = async function (collection, filter, set) {
  const uri = config.mongodbURI;

  const client = new MongoClient(uri, { useUnifiedTopology: true });

  try {
    // Connect to the MongoDB cluster
    await client.connect();

    // Update document
    return await client.db('swec-core').collection(collection).updateMany(filter, { $set: set });
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
};

// Delete document
exports.deleteDocument = async function (collection, filter) {
  const uri = config.mongodbURI;

  const client = new MongoClient(uri, { useUnifiedTopology: true });

  try {
    // Connect to the MongoDB cluster
    await client.connect();

    // Delete document
    return await client.db('swec-core').collection(collection).deleteOne(filter);
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
};

// Delete multiple documents
exports.deleteMultipleDocuments = async function (collection, filter) {
  const uri = config.mongodbURI;

  const client = new MongoClient(uri, { useUnifiedTopology: true });

  try {
    // Connect to the MongoDB cluster
    await client.connect();

    // Find document
    return await client.db('swec-core').collection(collection).deleteMany(filter);
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
};
