const express = require("express"); //Import Express
const MongoClient = require('mongodb').MongoClient; //Import MongoDB
const nodemailer = require('nodemailer'); //Import nodemailer
const bcrypt = require("bcryptjs"); //Import bcrypt
const session = require("express-session"); //Import express-sessionvar
MarkdownIt = require('markdown-it'), md = new MarkdownIt({"html": true}); //Import markdown jstransformer
const config = require('./config.json'); //Import config settings

var app = express();
var transporter = nodemailer.createTransport(config.nodemailTransport);

//Set up middleware
app.use(express.static('static'));
app.use(session({"secret": "4OneFIshTwoFIshRedFIshBlueFIsh2", "resave": false, "saveUninitialized": false}));
app.use(express.json());
app.set('view engine', 'pug');
app.set('views', './templates');

//Define templates with no extra processing
const finishedTemplates = [{"path": "/", "template": 'homepage'}];

/* * * * * * * * * *
 * CRUD Functions  *
 * * * * * * * * * */

//Create document
async function insertDocument(collection, value) {
  const uri = config.mongodbURI;

  const client = new MongoClient(uri, {useUnifiedTopology: true});

  try {
      // Connect to the MongoDB cluster
      await client.connect();

      //Insert document
      return await client.db("swec-core").collection(collection).insertOne(value);

  } catch (e) {
      console.error(e);
  } finally {
      await client.close();
  }
}

//Read document
async function findDocument(collection, filter) {
  const uri = config.mongodbURI;

  const client = new MongoClient(uri, {useUnifiedTopology: true});

  try {
      // Connect to the MongoDB cluster
      await client.connect();

      //Find document
      return await client.db("swec-core").collection(collection).findOne(filter);

  } catch (e) {
      console.error(e);
  } finally {
      await client.close();
  }
}

//Read multiple documents
async function findMultipleDocuments(collection, filter) {
  const uri = config.mongodbURI;

  const client = new MongoClient(uri, {useUnifiedTopology: true});

  try {
      // Connect to the MongoDB cluster
      await client.connect();

      //Find documents
      return await client.db("swec-core").collection(collection).find(filter).toArray();

  } catch (e) {
      console.error(e);
  } finally {
      await client.close();
  }
}

//Update document
async function updateDocument(collection, filter, set) {
  const uri = config.mongodbURI;

  const client = new MongoClient(uri, {useUnifiedTopology: true});

  try {
      // Connect to the MongoDB cluster
      await client.connect();

      //Update document
      return await client.db("swec-core").collection(collection).updateOne(filter, {$set: set});

  } catch (e) {
      console.error(e);
  } finally {
      await client.close();
  }
}

//Update multiple documents
async function updateMultipleDocuments(collection, filter, set) {
  const uri = config.mongodbURI;

  const client = new MongoClient(uri, {useUnifiedTopology: true});

  try {
      // Connect to the MongoDB cluster
      await client.connect();

      //Update document
      return await client.db("swec-core").collection(collection).updateMany(filter, {$set: set});

  } catch (e) {
      console.error(e);
  } finally {
      await client.close();
  }
}

//Delete document
async function deleteDocument(collection, filter) {
  const uri = config.mongodbURI;

  const client = new MongoClient(uri, {useUnifiedTopology: true});

  try {
      // Connect to the MongoDB cluster
      await client.connect();

      //Delete document
      return await client.db("swec-core").collection(collection).deleteOne(filter);

  } catch (e) {
      console.error(e);
  } finally {
      await client.close();
  }
}

//All requests in finishedTemplates
app.get('*', function (request, response, next) {
  if (finishedTemplates.find(template => template.path === request.path || template.path === request.path + "/") !== undefined) {
    response.render(finishedTemplates.find(template => template.path === request.path || template.path === request.path + "/").template, {});
  }
  if (next) next();
  else response.status(404).end();
});

//Blog homepage
app.get("/blog/", async function (request,  response) {
  var articles = [];
  await findMultipleDocuments("articles", {}).then(result => {
    articles = result;
  });

  articles.sort(function(a,b){
    return new Date(b.date) - new Date(a.date);
  });

  var recentHTML = JSON.parse(JSON.stringify(articles));

  articles.sort(function(a,b){
    return b.hits - a.hits;
  });

  var popularHTML = JSON.parse(JSON.stringify(articles.slice(0, 5)));

  response.render('blogmain', {"recent": recentHTML, "popular": popularHTML});
});

//Blog articles
app.get("/blog/article/:articleId/", async function (request, response) {
  var article;
  await findDocument("articles", {"id": new RegExp("^" + request.params.articleId + "$", "i")}).then(result => {
    article = result;
  });
  if (article === null) response.status(404).end();

  if (!request.session.viewed) {
    article.hits++;
    updateDocument("articles", {"id": new RegExp("^" + request.params.articleId + "$", "i")}, {"hits": article.hits});
    request.session.viewed = true;
  }

  response.render('blogarticle', article);
});

//Listen on port from config.json or process.env.PORT (for the heroku test)
app.listen(process.env.PORT || config.port, () => {
 console.log("Server running on port " + (process.env.port || config.port));
});
