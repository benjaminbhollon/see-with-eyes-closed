const MongoClient = require('mongodb').MongoClient;

/* * * * * * * * * *
 * CRUD Functions  *
 * * * * * * * * * */

class Crud {
  constructor(collection) {
    this.collection = collection;
    this.client = new MongoClient(config.mongodbURI, {useUnifiedTopology: true});

    // Connect to the MongoDB cluster
    await this.client.connect();
  }

  //Create document
  async insertDocument(value) {  
    try {
      //Insert document
      return await this.client.db("swec-core").collection(this.collection).insertOne(value);
  
    } catch (e) {
      console.error(e);
    } finally {
      await this.client.close();
    }
  }
  
  //Read document
  async findDocument(filter) {
    try {
      //Find document
      return await this.client.db("swec-core").collection(this.collection).findOne(filter);
  
    } catch (e) {
      console.error(e);
    } finally {
      await this.client.close();
    }
  }
  
  //Read multiple documents
  async findMultipleDocuments(filter) {  
    try {
      //Find documents
      return await this.client.db("swec-core").collection(this.collection).find(filter).toArray();
  
    } catch (e) {
      console.error(e);
    } finally {
      await this.client.close();
    }
  }
  
  //Update document
  async updateDocument(filter, set) {  
    try {
      //Update document
      return await this.client.db("swec-core").collection(this.collection).updateOne(filter, {$set: set});
  
    } catch (e) {
      console.error(e);
    } finally {
      await this.client.close();
    }
  }
  
  //Update multiple documents
  async updateMultipleDocuments(filter, set) {
    try {
        //Update document
        return await this.client.db("swec-core").collection(this.collection).updateMany(filter, {$set: set});
  
    } catch (e) {
      console.error(e);
    } finally {
      await this.client.close();
    }
  }
  
  //Delete document
  async deleteDocument(filter) {
    try {
      //Delete document
      return await this.client.db("swec-core").collection(this.collection).deleteOne(filter);
    } catch (e) {
      console.error(e);
    } finally {
      await this.client.close();
    }
  }

  //Validate Email
  validEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }
}

module.exports = Crud;