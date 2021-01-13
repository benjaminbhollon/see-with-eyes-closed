const express = require("express"); //Import Express
const MongoClient = require('mongodb').MongoClient; //Import MongoDB
const nodemailer = require('nodemailer'); //Import nodemailer
const bcrypt = require("bcryptjs"); //Import bcrypt
const config = require('./config.json'); //Import config settings

var app = express();
var transporter = nodemailer.createTransport(config.nodemailTransport);

//Set up static responses and getting json request bodies
app.use(express.static('static'));
app.use(express.json());
app.set('view engine', 'pug');
app.set('views', './templates');

/* * * * * * * * * *
 * CRUD Functions  *
 * * * * * * * * * */

//Create document
async function insertDocument(collection, value){
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

app.get('/blog/', async function (request,  response) {
  var articles = [];
  await findMultipleDocuments("articles", {}).then(result => {
    articles = result;
  });

  articles.sort(function(a,b){
    return new Date(b.date) - new Date(a.date);
  });

  var recentHTML = "";
  for (var a in articles) {
    if (new Date(articles[a].date) <= Date.now()) recentHTML += `
      <article class="recent__article">
        ` + (articles[a].image ? "<img src='" + articles[a].image + "' alt='banner'>" : "") + `
        <h1><a href="./article/` + articles[a].id + `">` + articles[a].title + `</a></h1>
        <p class="details">` + articles[a].date + " by " + articles[a].author + `<br><em>` + Math.ceil(articles[a].content.split(" ").length / 250) + ` minute read</em></p>
        ` + articles[a].summary + `
        <a href="./article/` + articles[a].id + `">Read the full article</a>
        <p>` + articles[a].tags.split(",").map(tag => '<a class="tag" rel="nofollow" href="./tag/' + tag + '">' + tag + '</a>').join(", ") + `</p>
      </article>
    `;
  }

  articles.sort(function(a,b){
    return b.hits - a.hits;
  });

  var popularHTML = "";
  articles.slice(0, 4).forEach((article) => {
    popularHTML += `
    <p>
      <a class="popular__article" href="./article/"` + article.id + `">
        <strong>` + article.title + `</strong><br>by ` + article.author + `<br>
        <em>Published on ` + article.date + `</em>
      </a>
    </p>
    `
  });


  response.render('blogmain', {"recent": recentHTML, "popular": popularHTML});
});

//Listen on port from config.json or process.env.PORT (for the heroku test)
app.listen(process.env.PORT || config.port, () => {
 console.log("Server running on port " + (process.env.port || config.port));
});
