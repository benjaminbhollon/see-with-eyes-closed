// Import modules
const express = require('express');
const sendmail = require('sendmail')();
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const bodyParser = require('body-parser');
const basicAuth = require('express-basic-auth');
const MarkdownIt = require('markdown-it');
const {encode} = require('html-entities');
const marked = require('marked').parse;
const frontMatter = require('front-matter');
const fs = require('fs');

const md = new MarkdownIt({ html: true, typographer: true, linkify: true });

md.use(require('markdown-it-container'), 'aside', {

  validate: function(params) {
    return params.trim().match(/^aside\s+(.*)$/);
  },

  render: function (tokens, idx) {
    var m = tokens[idx].info.trim().match(/^aside\s+(.*)$/);

    if (tokens[idx].nesting === 1) {
      // opening tag
      return '<aside>' + md.utils.escapeHtml(m[1]) + '\n';

    } else {
      // closing tag
      return '</aside>\n';
    }
  }
});

// Dummy policies
const policies = {
  privacy: false,
  cookies: false,
  terms: false
};

// Dummy things
const things = {};

for (const thing of fs.readdirSync('./src/things/')
  .map(t => t.split('.').slice(0, -1).join('.'))) {
  things[thing] = false;
}

// Import config
const config = require('./config.json');
const directory = require('./directory.json');

const crud = require('@bibliobone/mongodb-crud').bind(config.mongodbURI, 'swec-core');

const app = express();

// Set up middleware
app.use(cookieParser());
app.use(compression());
app.use('/admin/', basicAuth({ users: config.admins, challenge: true }));
app.use(express.static('static'));
app.use('/assets/', express.static('assets'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.json());
app.use((request, response, next) => {
  if (directory[request.path] !== undefined && request.method.toUpperCase() === 'GET') {
    return response.render(directory[request.path], {
      parameters: request.query,
      config,
      cookies:
      request.cookies,
    });
  }

  return next();
});
app.set('view engine', 'pug');
app.set('views', './templates');
let bcryptSalt;
bcrypt.genSalt(3, (err, salt) => {
  bcryptSalt = salt;
});

// Admin router
const adminRouter = require('./routers/admin');

app.use('/admin/', adminRouter);

/* BLOG */
// Blog homepage
app.get('/', async (request, response) => {
  let articles = [];
  await crud.findMultipleDocuments('articles', {}).then((result) => {
    articles = result;
  });

  articles.sort((a, b) => new Date(b.date) - new Date(a.date));

  return response.render('homepage.pug', {
    article: articles[0],
    cookies: request.cookies,
  });
});

// Articles
app.get('/articles/', async (request, response) => {
  let articles = [];
  await crud.findMultipleDocuments('articles', {}).then((result) => {
    articles = result;
  });

  articles.sort((a, b) => new Date(b.date) - new Date(a.date));

  const recentHTML = JSON.parse(JSON.stringify(articles));

  articles.sort((a, b) => b.hits - a.hits);

  const popularHTML = JSON.parse(JSON.stringify(articles.slice(0, 5)));

  return response.render('articles.pug', {
    recent: recentHTML,
    popular: popularHTML,
    parameters: request.query,
    md,
    cookies: request.cookies,
    subscribed: request.cookies.subscribed,
  });
});

// Blog article
app.get('/articles/:articleId/', async (request, response) => {
  let article = {};
  await crud.findDocument('articles', { id: request.params.articleId }).then((result) => {
    article = result;
  });
  if (article === null) {
    response.status(404);
    return response.render('errors/404.pug', { cookies: request.cookies });
  }

  // Similar Articles
  let related = [];
  await crud.aggregate('articles', [
    {
      $match: {
        tags: {
          $elemMatch: {
            $in: article.tags,
          },
        },
        id: {
          $ne: article.id,
        },
      },
    },
    {
      $addFields: {
        matching: {
          $filter: {
            input: '$tags',
            cond: {
              $in: [
                '$$this', article.tags,
              ],
            },
          },
        },
      },
    },
    {
      $set: {
        matching: {
          $size: '$matching',
        },
      },
    },
    {
      $sort: {
        matching: -1,
      },
    },
    {
      $limit: 3,
    },
  ]).then((result) => {
    related = result;
  });

  // if (!request.session.viewed && request.headers['user-agent'] !== 'verbGuac 1.0') {
  article.hits += 1;
  crud.updateDocument('articles', { id: new RegExp(`^${request.params.articleId}$`, 'i') }, { hits: article.hits });
  // request.session.viewed = true;
  // }

  function timeSince(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    let interval = seconds / 31536000;

    if (interval > 1) {
      return `${Math.floor(interval)} years`;
    }
    interval = seconds / 2592000;
    if (interval > 1) {
      return `${Math.floor(interval)} months`;
    }
    interval = seconds / 86400;
    if (interval > 1) {
      return `${Math.floor(interval)} days`;
    }
    interval = seconds / 3600;
    if (interval > 1) {
      return `${Math.floor(interval)} hours`;
    }
    interval = seconds / 60;
    if (interval > 1) {
      return `${Math.floor(interval)} minutes`;
    }
    return `${Math.floor(seconds)} seconds`;
  }

  // Comment time ago
  if (article.comments) {
    article.comments = article.comments.map((comment) => {
      const newComment = { ...comment };
      newComment.time = `${timeSince(newComment.time * 1000)} ago`;
      return newComment;
    });
  }
  return response.render('article.pug', {
    article,
    related,
    siteKey: config.reCAPTCHApublic,
    parameters: request.query,
    md,
    cookies: request.cookies,
    subscribed: request.cookies.subscribed,
  });
});

// Add comment
app.post('/articles/:articleId/comment', async (request, response) => {
  if (!request.body.name || !request.body.comment || (request.body.comment && request.body.comment.length > 512) || (request.body.name && request.body.name.length > 128)) return response.redirect(302, `/blog/article/${request.params.articleId}/?err=${400}&name=${encodeURIComponent(request.body.name)}&comment=${encodeURIComponent(request.body.comment)}#comments`);
  let reCAPTCHAvalid = false;

  await Request(`https://www.google.com/recaptcha/api/siteverify?secret=${config.reCAPTCHAprivate}&response=${request.body['g-recaptcha-response']}`, async (error, result, body) => {
    reCAPTCHAvalid = JSON.parse(body).success;

    if (!reCAPTCHAvalid) {
      const url = `/blog/article/${request.params.articleId}/?err=${401}&name=${encodeURIComponent(request.body.name)}&comment=${encodeURIComponent(request.body.comment)}#comments`;
      return response.redirect(302, url);
    }

    let article;
    await crud.findDocument('articles', { id: request.params.articleId }).then((result2) => {
      article = result2;
    });

    if (article === null) return response.render('errors/404.pug', { cookies: request.cookies });

    if (request.session.identifier === undefined) {
      request.session.identifier = Math.floor(Math.random() * 8999999) + 1000000;
    }

    article.comments.push({
      identifier: await bcrypt.hash(request.session.identifier.toString(), bcryptSalt),
      author: request.body.name,
      message: request.body.comment,
      time: Math.floor(Date.now() / 1000),
    });
    crud.updateDocument('articles', { id: request.params.articleId.toString() }, { comments: article.comments });

    return response.redirect(302, `/blog/article/${request.params.articleId}/#comments`);
  });
});

// Add/remove reaction
app.post('/articles/:articleId/reactions/:reaction/:action', async (request, response) => {
  // TECH DEBT: Integrate special updates into mongdb-crud
  let article = null;
  await crud.findDocument('articles', { id: request.params.articleId }).then((result) => {
    article = result;
  });
  const reaction = article.reactions.find((r) => r.name === request.params.reaction);
  if (article === null || !reaction) return response.status(404).end();
  const { reactions } = article;
  reactions[reactions.indexOf(reaction)].count = reaction.count + (request.params.action === 'remove' ? -1 : 1);
  await crud.updateDocument('articles', { id: article.id }, { reactions });
  response.status(204).end();
});

// Sign article
app.post('/articles/:articleId/sign', async (request, response) => {
  let article = null;
  await crud.findDocument('articles', { id: request.params.articleId }).then((result) => {
    article = result;
  });
  if (article === null || article.content.slice(-14) !== '[[signatures]]') return response.status(404).end();

  if (typeof article.signedBy === 'undefined') article.signedBy = [];

  if (request.body.name.length > 64) return response.redirect(302, `/blog/article/${request.params.articleId}/?err=a400`);

  article.signedBy.push(String(request.body.name));

  await crud.updateDocument('articles', { id: request.params.articleId }, { signedBy: article.signedBy });

  return response.redirect(302, `/blog/article/${request.params.articleId}/`);
});

// Subscribe actions
app.post('/subscribe/nope', async (request, response) => {
  response.cookie('subscribed', true);

  return response.status(204).end();
});

// Projects homepage
/*app.get('/projects/', async (request, response) => {
  let projects = [];
  await crud.findMultipleDocuments('projects', {}).then((result) => {
    projects = result;
  });
  response.render('projects.pug', {
    projects,
    md,
    cookies: request.cookies
  });
});
*/
// Writing homepage
/*app.get('/writing/', async (request, response) => {
  let writing = [];
  await crud.findMultipleDocuments('writing', {}).then((result) => {
    writing = result;
  });

  // Sort by published
  writing.sort((a, b) => {
    if (a.published === b.published || (a.published !== false && b.published !== false)) return 0;
    if (a.published === false) return 1;
    return -1;
  });

  return response.render('writing.pug', { writing, md, cookies: request.cookies });
});
*/
// Literary work display page
/*app.get('/writing/:workId/', async (request, response) => {
  let work = {};
  await crud.findDocument('writing', { id: request.params.workId }).then((result) => {
    work = result;
  });

  if (work === null || work.published === false || work.published.website !== true) {
    return response.render('errors/404.pug', { cookies: request.cookies });
  }

  return response.render('writingwork.pug', {
    work,
    title: work.title,
    metaDescription: md.render(work.synopsis.split('\n\n')[0]).replace(/(<([^>]+)>)/ig, ''),
    cookies: request.cookies,
    md,
  });
});
*/
// Contact me
app.post('/contact/send/', async (request, response) => {
  const message = {
    from: 'benjamin@seewitheyesclosed.com',
    to: config.email,
    subject: request.body.subject.toString(),
    text: `Message from ${request.body.email.toString()}:${request.body.message.toString()}`,
  };
  let reCAPTCHAvalid = false;

  await Request(`https://www.google.com/recaptcha/api/siteverify?secret=${config.reCAPTCHAprivate}&response=${request.body['g-recaptcha-response']}`, async (error, result, body) => {
    reCAPTCHAvalid = JSON.parse(body).success;

    if (!reCAPTCHAvalid) {
      const url = `/contact/?err=${401}&subject=${encodeURIComponent(request.body.subject)}&email=${encodeURIComponent(request.body.email)}&message=${encodeURIComponent(request.body.message)}`;
      return response.redirect(302, url);
    }

    await sendmail(message);

    return response.redirect(302, '/contact/?success=true');
  });
});

// Policies
app.get('/policies/:policy/', async (request, response, next) => {
  if (policies[request.params.policy] === undefined) return next();
  if (policies[request.params.policy] === false) {
    const raw = fs.readFileSync(
      './src/policies/' + request.params.policy + '.md',
      'utf8'
    );
    policies[request.params.policy] = {
      metadata: frontMatter(raw).attributes,
      body: marked.parse(frontMatter(raw).body)
    }
  }

  return response.render('policy.pug', {
    metadata: policies[request.params.policy].metadata,
    body: policies[request.params.policy].body,
    md,
    cookies: request.cookies
  });
});

// What is...
app.get('/what-is-:thing/', async (request, response, next) => {
  if (things[request.params.thing] === undefined) return next();
  if (things[request.params.thing] === false) {
    const raw = fs.readFileSync(
      './src/things/' + request.params.thing + '.md',
      'utf8'
    );
    things[request.params.thing] = {
      metadata: frontMatter(raw).attributes,
      body: marked.parse(frontMatter(raw).body).replace(/<a\ /g, "<a target='_blank' rel='noopener' ").replace(/<img/g, "<img loading='lazy'").replace("<iframe", "<iframe loading='lazy'")
    }
  }

  return response.render('what-is.pug', {
    metadata: things[request.params.thing].metadata,
    body: things[request.params.thing].body,
    md,
    cookies: request.cookies
  });
});

// Gamified Reading Reading Bingo
app.post('/projects/gamified-reading/finriq/reading-bingo/', async (request, response) => {
  /* nodeHtmlToImage({
    output: './static/projects/gamified-reading/finriq/reading-bingo/bingo.png',
    html: `<html>
    <body>
      <style>
      table {
        border-collapse: collapse;
        font-family: calibri, sans-serif;
        width: 100%;
        min-height: 100vh;
      }
      td {
        width: 100px;
        border: 1px solid #000;
        padding: 3px;
        text-align: center;
      }
      </style>
      ${request.body.html}
    </body>
    </html>`,
    puppeteerArgs: puppeteer,
  })
    .then(() => response.status(201).json({ success: true })); */
  response.status(500).end();
});


// Redirects
app.get('/projects/learnclef/*', async (request, response) => response.redirect(301, '/projects/learn-clef/'));
app.get('/projects/:id/*', async (request, response) => {
  return response.redirect(301, 'https://benjaminhollon.com/projects/' + request.params.id + '/');
});
app.get('/writing/:id/', async (request, response) => {
  return response.redirect(301, 'https://benjaminhollon.com/writing/' + request.params.id + '/');
});
app.get('/writing/', async (request, response) => {
  return response.redirect(301, 'https://benjaminhollon.com/writing/');
});
app.get('/projects/', async (request, response) => {
  return response.redirect(301, 'https://benjaminhollon.com/projects/');
});
app.get('/blog/', async (request, response) => {
  return response.redirect(301, `/articles/`);
});
app.get('/blog/article/:articleId/', async (request, response) => {
  return response.redirect(301, `/articles/${request.params.articleId}/`);
});

// Change color theme
const supportedThemes = ['dark', 'light'];
app.get('/settings/theme/:theme', async (request, response) => {
  if (supportedThemes.indexOf(request.params.theme) === -1) return response.status(404).end();

  response.cookie('theme', request.params.theme);
  if (request.query.refresh === 'false') return response.status(204).end();
  else return response.redirect(302, request.headers['referer']);
});

// Change font family
const supportedFontFamilies = ['serif', 'sans', 'monospace'];
app.get('/settings/font/:fontFamily', async (request, response) => {
  if (supportedFontFamilies.indexOf(request.params.fontFamily) === -1) return response.status(404).end();

  response.cookie('fontFamily', request.params.fontFamily);
  if (request.query.refresh === 'false') return response.status(204).end();
  else return response.redirect(302, request.headers['referer']);
});

// Change size
app.get('/settings/size/:size', async (request, response) => {
  const size = parseInt(request.params.size);
  if (size < 1 || size > 5) return response.status(404).end();

  response.cookie('size', size);
  if (request.query.refresh === 'false') return response.status(204).end();
  else return response.redirect(302, request.headers['referer']);
});

// RSS Feed
app.get('/feed/', async (request, response) => {
  const appendComplete = `\n\n---\n\nThis article was first published on [the See With Eyes Closed website](https://${request.hostname}/), but the full article was generously provided to you via RSS. Please consider [visiting the article on the site](https://${request.hostname}/articles/[[ID]]/) to leave feedback or view similar See With Eyes Closed articles.`;

  const appendSummary = `\n\n---\n\nThis article has elements in it that cannot be sent through RSS. You can [view the full article](https://${request.hostname}/articles/[[ID]]/) on [the See With Eyes Closed website](https://${request.hostname}/).`;

  let articles = [];

  await crud.findMultipleDocuments('articles', {}).then((result) => {
    articles = result.filter((value) => new Date(value.date) <= new Date());
  });

  articles.sort((a, b) => new Date(b.date) - new Date(a.date));

  const feed = articles
    .slice(0, 15)
    .filter(article => new Date(article.date) <= Date.now())
    .map((article) => {
      const date = new Date(article.date);
      if (article.content.indexOf('<script') === -1 && article.content.indexOf('<style') === -1) {
        return `<item>
          <title>${article.title}</title>
          <link>https://${request.hostname}/articles/${article.id}/</link>
          <guid ispermalink="false">${article._id.toString()}</guid>
          <pubDate>${date.toUTCString()}</pubDate>
          <description>${encode(md.render(article.content + appendComplete.replace('[[ID]]', article.id)), {mode: 'nonAsciiPrintable', level: 'xml'})}</description>
        </item>`;
      }

      console.log(article.id);
      return `<item>
        <title>${article.title}</title>
        <link>https://${request.hostname}/articles/${article.id}/</link>
        <guid ispermalink="false">${article._id.toString()}</guid>
        <pubDate>${date.toUTCString()}</pubDate>
        <description>${encode(md.render(article.summary + appendSummary.replace('[[ID]]', article.id)), {mode: 'nonAsciiPrintable', level: 'xml'})}</description>
      </item>`;
    });

  response.setHeader('Content-type', 'application/xml+rss');
  response.send(
    `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <title>See With Eyes Closed</title>
  <description>A blog by Benjamin Hollon.</description>
  <language>en-us</language>
  <copyright>© Benjamin Hollon ${(new Date()).getFullYear()}. Content licensed under CC BY-NC 4.0.</copyright>
  <link>https://${request.hostname}/</link>${
  feed.join('')
}
  </channel>
  </rss>`,
  );
});

// Errors
app.use((request, response) => {
  response.status(404);
  response.render('errors/404.pug', { cookies: request.cookies });
});

// Listen on port from config.json
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
