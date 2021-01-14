const express = require("express"); //Import Express
const MongoClient = require('mongodb').MongoClient; //Import MongoDB
const nodemailer = require('nodemailer'); //Import nodemailer
const bcrypt = require("bcryptjs"); //Import bcrypt
const session = require("express-session"); //Import express-sessionvar
MarkdownIt = require('markdown-it'), md = new MarkdownIt({"html": true}); //Import markdown jstransformer
const fetch = require('isomorphic-fetch'), bodyParser = require('body-parser'); //Fetch
const compression = require('compression'); //Import compression
const config = require('./config.json'); //Import config settings

var app = express();
var transporter = nodemailer.createTransport(config.nodemailTransport);

//Set up middleware
app.use(express.static('static'));
app.use(session({"secret": "4OneFIshTwoFIshRedFIshBlueFIsh2", "resave": false, "saveUninitialized": false}));
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(compression());
app.set('view engine', 'pug');
app.set('views', './templates');
var bcryptSalt;
bcrypt.genSalt(3, function (err, salt) {
  bcryptSalt = salt;
});

//Define templates with no extra processing
const finishedTemplates = [{"path": "/", "template": "homepage"}, {"path": "/contact/", "template": "contact"}];

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
    return response.render(finishedTemplates.find(template => template.path === request.path || template.path === request.path + "/").template, {"parameters": request.query});
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

  response.render('blogmain', {"recent": recentHTML, "popular": popularHTML, "parameters": request.query});
});

//Blog articles
app.get("/blog/article/:articleId/", async function (request, response) {
  var article;
  var articles;
  await findMultipleDocuments("articles", {}).then(result => {
    article = result.find(article => article.id.toUpperCase() === request.params.articleId.toUpperCase());
    articles = result;
  });
  if (article === undefined) return response.status(404).end();

  if (!request.session.viewed) {
    article.hits++;
    updateDocument("articles", {"id": new RegExp("^" + request.params.articleId + "$", "i")}, {"hits": article.hits});
    request.session.viewed = true;
  }

  function timeSince(date) {
    var seconds = Math.floor((new Date() - date) / 1000);

    var interval = seconds / 31536000;

    if (interval > 1) {
      return Math.floor(interval) + " years";
    }
    interval = seconds / 2592000;
    if (interval > 1) {
      return Math.floor(interval) + " months";
    }
    interval = seconds / 86400;
    if (interval > 1) {
      return Math.floor(interval) + " days";
    }
    interval = seconds / 3600;
    if (interval > 1) {
      return Math.floor(interval) + " hours";
    }
    interval = seconds / 60;
    if (interval > 1) {
      return Math.floor(interval) + " minutes";
    }
    return Math.floor(seconds) + " seconds";
  }

  //Comment time ago
  for (var c in article.comments) {
    article.comments[c].time = timeSince(article.comments[c].time * 1000) + " ago";
  }

  //Similar Articles
  var related = [];
  var matches;
  for (var a in articles) {
    if (articles[a].id === article.id) continue;
    matches = 0;
    for (var t in article.tags) {
      if (articles[a].tags.indexOf(article.tags[t]) !== -1) matches++;
    }
    articles[a].matches = matches;
    related.push(articles[a]);
  }
  related.sort(function (a,b) {
    return b.matches - a.matches;
  });
  related = related.slice(0, 5);

  response.render('blogarticle', {"article": article, "related": related, "siteKey": config.reCAPTCHApublic, "parameters": request.query});
});

//Add comment
app.post("/blog/article/:articleId/comment", async function (request, response) {
  if (!request.body.name || !request.body.comment || (request.body.comment && request.body.comment.length > 512) || (request.body.name && request.body.name.length > 128)) return response.redirect(302, "/blog/article/" + request.params.articleId + "/#comment-form?err=" + 400 + "&name=" + encodeURIComponent(request.body.name) + "&comment=" + encodeURIComponent(request.body.comment));
  var reCAPTCHAvalid = false;
  await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${config.reCAPTCHAprivate}&response=${request.body["g-recaptcha-response"]}`, {
    method: 'post'
  }).then(result => result.json()).then(google_response => reCAPTCHAvalid = google_response);
  if (!reCAPTCHAvalid) return response.redirect(302, "/blog/article/" + request.params.articleId + "/#comment-form?err=" + 401 + request.params.articleId + "&name=" + encodeURIComponent(request.body.name) + "&comment=" + encodeURIComponent(request.body.comment));

  var article;
  await findDocument("articles", {"id": request.params.articleId}).then(result => {
    article = result;
  });
  if (article === null) response.status(404).end();

  if (request.session.identifier == undefined) request.session.identifier = Math.floor(Math.random() * 8999999) + 1000000;
  article.comments.push({"identifier": await bcrypt.hash(request.session.identifier.toString(), bcryptSalt), "author": request.body.name, "message": request.body.comment, "time": Math.floor(Date.now() / 1000)});
  updateDocument("articles", {"id": request.params.articleId.toString()}, {"comments": article.comments});

  response.redirect(302, "/blog/article/" + request.params.articleId + "/#comment-form");
});

//Projects homepage
app.get("/projects/", async function (request, response) {
  var projects = [];
  await findMultipleDocuments("projects", {}).then(result => {
    projects = result;
  });
  response.render("projectsmain", {"projects": projects});
});

//Writing homepage
app.get("/writing/", async function (request, response) {
  var writing = [];
  await findMultipleDocuments("writing", {}).then(result => {
    writing = result;
  });
  response.render("writingmain", {"writing": writing});
});

//Contact me
app.post("/contact/send/", async function (request, response) {
  var message = {
    from: 'noreply@seewitheyesclosed.com',
    to: config.email,
    subject: request.body.subject.toString(),
    text: "Message from " + request.body.email.toString() + ":" + request.body.message.toString()
  };
  await transporter.sendMail(message, function(err) {
    if (err) {
      console.log(err)
    }
  });

  response.redirect(302, "/contact/?success=true");
});

//Policies
app.get("/policies/:policy/", function (request, response) {
  var policies = {
    "privacy": {
      "title": "Privacy Policy",
      "description": "The privacy policy for the See With Eyes Closed website and blog.",
      "markdown": `# Privacy Policy
I care about your privacy. I promise that no matter what you do on this website, I will be doing the most I possibly can to ensure your safety.

I only collect information you give me with the understanding that I will store it. I don't use any creepy trackers or analytics programs to gather information about you. The only information I gather is how many people visit each article. I don't even keep track of who it is that visits them.

Part of this is because I'm too lazy to collect more info than I do, but most of it is because I don't like it when websites collect my data, so I won't collect yours.

That being said, I may have to use scripts from other websites on occasion (including but not limited to embedded Youtube videos and Google reCAPTCHA) that do collect information. This privacy policy does not apply to them and you should see their individual privacy policies. If you worry about these websites, I recommend installing some sort of blocker for their trackers. I use and recommend [Brave Browser](https://brave.com), which automatically blocks all ads and trackers.

If you have any concerns about your data or privacy, please [contact me](/contact/) and I'll try to assist you.

This policy is effective as of March 26 2020.`,
      "related": [
        {"name": "Cookie Policy", "link": "/policies/cookies/"},
        {"name": "Terms of Use", "link": "/policies/terms/"}
      ]
    },
    "cookies": {
      "title": "Cookie Policy",
      "description": "The cookie policy for the See With Eyes Closed website and blog.",
      "markdown": `# Cookie Policy

### What Are Cookies?
Cookies are small text files that websites store on your computer to help remember information about you (usually to make your experience better). For example, if you ever click "remember me" on a login page, the website uses a cookie to remember you.

### The Cookies I Use
I use very few cookies and none of them are personally identifying unless I specifically tell you otherwise. Disabling cookies will not break my website. However, you may be annoyed because the "accept our cookie policy" and "subscribe for blog updates" banners will keep appearing, no matter how many times you dismiss them. This is because I have to use cookies to remember if you've seen it before.

### Third-Party Cookies
Sometimes, I need to use scripts or services from other websites. Some of these (including but not limited to embedded Youtube videos and Google reCAPTCHA) set cookies. This cookie policy does not apply to them and you should see their individual cookie policies.

### Disabling Cookies
It is possible to disable cookies in your browser settings (the method differs by the browser, look up yours). Although this will not, for the most part, break my site (see above), it may break other websites, and I don't recommend you disable cookies, as they're usually just to help you out.

I would, however, recommend blocking cross-site cookies, as these can track you between the different sites you visit. I use and recommend the [Brave browser](https://brave.com/) for this.

### More Information

I hope this cleared up any questions you had. To sum up: I hardly use cookies, and never with personal information unless I specifically tell you; some external scripts or services may set cookies, so be careful about that; and it is possible to disable cookies, but you probably won't like the result.

If you still have questions, you can [contact me](/contact/) and I'll work to help you resolve them.

This policy is effective as of March 26 2020.`,
      "related": [
        {"name": "Privacy Policy", "link": "/policies/privacy/"},
        {"name": "Terms of Use", "link": "/policies/terms/"}
      ]
    },
    "terms": {
      "title": "Terms of Use",
      "description": "The terms of use for the See With Eyes Closed website and blog.",
      "markdown": `# Terms of Use
### 1. Terms

First, I have to use some fancy legal jargon.

By accessing the website at [https://seewitheyesclosed.com](https://seewitheyesclosed.com), you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws. If you do not agree with any of these terms, you are prohibited from using or accessing this site. The materials contained in this website are protected by applicable copyright and trademark law.

In other words, don't download anything from my website unless I tell you that it's okay. That's super not cool and against the law besides.
### 2. Use License
Here comes some more legal terms, but I'll summarize afterward.
<ol type="a">
  <li>
    Permission is granted to temporarily download one copy of the materials (information or software) on See With Eyes Closed's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
    <ol type="i">
      <li>modify or copy the materials;</li>
      <li>use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
      <li>attempt to decompile or reverse engineer any software contained on See With Eyes Closed's website;</li>
      <li>remove any copyright or other proprietary notations from the materials; or</li>
      <li>transfer the materials to another person or "mirror" the materials on any other server.</li>
    </ol>
  </li>
  <li>This license shall automatically terminate if you violate any of these restrictions and may be terminated by See With Eyes Closed at any time. Upon terminating your viewing of these materials or upon the termination of this license, you must destroy any downloaded materials in your possession whether in electronic or printed format.</li>
</ol>

Basically, you can view the content on the website, but don't download it, change it, try to sell it or pass it off as your own, decompile any of the scripts that I use unless I give you the code, take off copyright notices, or give a copy to other people except through a link to the website.

### 3. Disclaimer
Here we go again...
<ol type="a">
  <li>The materials on See With Eyes Closed's website are provided on an 'as is' basis. See With Eyes Closed makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</li>
  <li>Further, See With Eyes Closed does not warrant or make any representations concerning the accuracy, likely results, or reliability of the use of the materials on its website or otherwise relating to such materials or on any sites linked to this site.</li>
</ol>

So, if there's an error with my website, too bad. It's a take it or leave it situation. However, if you do find an error, I'd like to hear about it, so don't hesitate to [contact me](/contact/).

### 4. Limitations
In no event shall See With Eyes Closed or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on See With Eyes Closed's website, even if See With Eyes Closed or a See With Eyes Closed authorized representative has been notified orally or in writing of the possibility of such damage. Because some jurisdictions do not allow limitations on implied warranties, or limitations of liability for consequential or incidental damages, these limitations may not apply to you.

If something happens to you because my website doesn't work properly, I apologize, but it's really not my fault.

### 5. Accuracy of Materials
The materials appearing on See With Eyes Closed's website could include technical, typographical, or photographic errors. See With Eyes Closed does not warrant that any of the materials on its website are accurate, complete or current. See With Eyes Closed may make changes to the materials contained on its website at any time without notice. However See With Eyes Closed does not make any commitment to update the materials.

In other words, I'm human. I make mistakes. Things I post might not be right, so take it all with a grain of salt.

### 6. Links
See With Eyes Closed has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by See With Eyes Closed of the site. Use of any such linked website is at the user's own risk.

Another way of saying this is that I can't be responsible for any other websites, even if I link to them, so use them at your own risk.

### 7. Modifications
See With Eyes Closed may revise these terms of service for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.

I may have to change this from time to time and I may not be able to contact you. But you don't need to worry about that, because you are only responsible for the terms as they are when you are browsing.

These terms and conditions effective as of 26 March 2020.`,
      "related": [
        {"name": "Privacy Policy", "link": "/policies/privacy/"},
        {"name": "Cookie Policy", "link": "/policies/cookies/"}
      ]
    }
  }

  if (policies[request.params.policy] === undefined) return response.status(204).end();
  else response.render("policy", policies[request.params.policy])
});

//Redirects
app.get("/projects/learnclef/", function (request, response) {
  response.redirect(301, "/projects/learn-clef/")
});

//Listen on port from config.json or process.env.PORT (for the heroku test)
app.listen(process.env.PORT || config.port, () => {
 console.log("Server running on port " + (process.env.port || config.port));
});
