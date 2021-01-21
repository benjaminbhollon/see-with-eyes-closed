const bcrypt = require("bcryptjs");
const MarkdownIt = require('markdown-it'), md = new MarkdownIt({"html": true});

//Import config
const config = require('./config.json');

class Get {
  constructor(request, response) {
    this.request = request;
    this.response = response;
    //Define templates with no extra processing
    this.finishedTemplates = config.finishedTemplates;
  }

  //All requests in finishedTemplates
  static all() {
    app.get('*', function (next) {
      if (this.finishedTemplates.find(template => template.path === thisrequest.path || template.path === this.request.path + "/") !== undefined) {
        return this.response.render(this.finishedTemplates.find(template => template.path === this.request.path || template.path === this.request.path + "/").template, {"parameters": this.request.query, "config": config});
      }
      if (next) next();
      else this.response.status(404).end();
    });
  }

  //Blog homepage
  static blog() {
    app.get("/blog/", async function () {
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

      this.response.render('blogmain', {"recent": recentHTML, "popular": popularHTML, "parameters": this.request.query});
    });
  }

  static articles() {
    //Blog articles
    app.get("/blog/article/:articleId/", async function () {
      var article;
      var articles;
      await findMultipleDocuments("articles", {}).then(result => {
        article = result.find(article => article.id.toUpperCase() === this.request.params.articleId.toUpperCase());
        articles = result;
      });
      if (article === undefined) return this.response.status(404).end();
    
      if (!this.request.session.viewed) {
        article.hits++;
        updateDocument("articles", {"id": new RegExp("^" + this.request.params.articleId + "$", "i")}, {"hits": article.hits});
        this.request.session.viewed = true;
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
    
      this.response.render('blogarticle', {"article": article, "related": related, "siteKey": config.reCAPTCHApublic, "parameters": this.request.query});
    });
  }

  static unsubscribe() {
    //Unsubscribe
    app.get("/blog/unsubscribe/", async function () {
      var title = "Unsubscribe";
      var message = "<a href='https://xkcd.com/2257/'><img alt='xkcd Unsubscribe Message' src='https://imgs.xkcd.com/comics/unsubscribe_message.png' title=\"A mix of the two is even worse: 'Thanks for unsubscribing and helping us pare this list down to reliable supporters.'\"></a><p><cite>- Randall Munroe, xkcd ([CC BY-NC 2.5](https://creativecommons.org/licenses/by-nc/2.5/))</cite></p><p>Or was that a mistake? You can [resubscribe](/blog/subscribe/)!</p>";
      var isValid = false;
      await bcrypt.compare(this.request.query.email, this.request.query.token).then(result => {
        isValid = result;
      });
    
      if (!isValid) {
        title = "418 Error: I'm a teapot";
        message = "<article>\n\n# 418 Error: I'm a teapot\n\n_The resulting entity body may be short and stout_\n\nWe're honestly not sure what went wrong, but evidence suggests that you tried to brew coffee in a teapot. Make sure you got here by clicking \"Unsubscribe\" in one of my emails. If that doesn't work, [contact me](/contact/) and I'll try to work it out.</article>"
      } else {
        await deleteDocument("subscribers", {"email": this.request.query.email.toLowerCase()});
      }
    
      this.response.render("layout", {title: title, content: message});
    });
  }

  static projects() {
    //Projects homepage
    app.get("/projects/", async function () {
      var projects = [];
      await findMultipleDocuments("projects", {}).then(result => {
        projects = result;
      });
      this.response.render("projectsmain", {"projects": projects});
    });
  }

  static writing() {
    //Writing homepage
    app.get("/writing/", async function () {
      var writing = [];
      await findMultipleDocuments("writing", {}).then(result => {
        writing = result;
      });
    
      //Sort by published
      writing.sort(function (a,b) {
        if (a.published === b.published || (a.published !== false && b.published !== false)) return 0;
        else if (a.published === false) return 1
        return -1;
      });
    
      this.response.render("writingmain", {"writing": writing});
    });
  }

  static literary() {
    //Literary work display page
    app.get("/writing/:workId/", async function () {
      var work = {};
      await findDocument("writing", {"id": this.request.params.workId}).then(result => {
        work = result;
      });
      if (work === null || work.published === false || work.published.website !== true) return this.response.status(404).end();
    
      this.response.render("writingwork", {"work": work, "title": work.title, "metaDescription": md.render(work.synopsis.split("\n\n")[0]).replace( /(<([^>]+)>)/ig, '')});
    });
  }

  static redirects() {
    //Redirects
    app.get("/projects/learnclef/", function () {
      this.response.redirect(301, "/projects/learn-clef/")
    });
  }
}

module.exports = Get;