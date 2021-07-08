// Import modules
const vocado = require('vocado');
const sendmail = require('sendmail')();
const bcrypt = require('bcryptjs');
// const session = require('express-session');
const basicAuth = require('express-basic-auth');
const Request = require('request');
// const SitemapGenerator = require('sitemap-generator');
const MarkdownIt = require('markdown-it');

const md = new MarkdownIt({ html: true, typographer: true, linkify: true });

const weekDaysShort = ['Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat'];
const monthsShort = ['Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'];

// Import emails, messages, and policies
const policies = require('./src/policies.json');

// Import config
const config = require('./config.json');
const directory = require('./directory.json');

const crud = require('@bibliobone/mongodb-crud').bind(config.mongodbURI, 'swec-core');

const app = vocado();

// Crawl site once per day
/* const generator = SitemapGenerator('https://seewitheyesclosed.com', {
  stripQuerystring: true,
  filepath: './static/sitemap.xml',
  userAgent: 'verbGuac 1.0',
  priorityMap: [1.0,
    0.9,
    0.8],
});
generator.on('done', () => {
  console.log('Sitemap for seewitheyesclosed.com created.');
});
setInterval(generator.start, 1000 * 60 * 60 * 24); */

// Set up middleware
// app.use(cookieParser());
// app.use(compression());
app.use('/admin/', basicAuth({ users: config.admins, challenge: true }));
app.static('./static/');
// app.use(session({ secret: config.sessionSecret, resave: false, saveUninitialized: false }));
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
app.templates('pug', './templates/');
let bcryptSalt;
bcrypt.genSalt(3, (err, salt) => {
  bcryptSalt = salt;
});

// Admin router
const adminRouter = require('./routers/admin');

app.use('/admin/', adminRouter);

// Blog homepage
app.get('/blog/', async (request, response) => {
  let articles = [];
  await crud.findMultipleDocuments('articles', {}).then((result) => {
    articles = result;
  });

  articles.sort((a, b) => new Date(b.date) - new Date(a.date));

  const recentHTML = JSON.parse(JSON.stringify(articles));

  articles.sort((a, b) => b.hits - a.hits);

  const popularHTML = JSON.parse(JSON.stringify(articles.slice(0, 5)));

  return response.render('blogmain.pug', {
    recent: recentHTML,
    popular: popularHTML,
    parameters: request.query,
    md,
    cookies: request.cookies,
    subscribed: request.cookies.subscribed,
  });
});

// Blog article
app.get('/blog/article/:articleId/', async (request, response) => {
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
  return response.render('blogarticle.pug', {
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
app.post('/blog/article/:articleId/comment', async (request, response) => {
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

// Add reaction
app.post('/blog/article/:articleId/react/:reaction/:action', async (request, response) => {
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
app.post('/blog/article/:articleId/sign', async (request, response) => {
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
app.get('/projects/', async (request, response) => {
  let projects = [];
  await crud.findMultipleDocuments('projects', {}).then((result) => {
    projects = result;
  });
  response.render('projectsmain.pug', { projects, md, cookies: request.cookies });
});

// Writing homepage
app.get('/writing/', async (request, response) => {
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

  return response.render('writingmain.pug', { writing, md, cookies: request.cookies });
});

// Literary work display page
app.get('/writing/:workId/', async (request, response) => {
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
app.get('/policies/:policy/', async (request, response) => {
  const policyPages = {
    privacy: {
      title: policies.privacy.title,
      description: policies.privacy.description,
      markdown: policies.privacy.markdown.join('\n'),
      related: [
        {
          name: 'Cookie Policy',
          link: '/policies/cookies/',
        },
        {
          name: 'Terms of Use',
          link: '/policies/terms/',
        },
      ],
    },
    cookies: {
      title: policies.cookies.title,
      description: policies.cookies.description,
      markdown: policies.cookies.markdown.join('\n'),
      related: [
        {
          name: 'Privacy Policy',
          link: '/policies/privacy/',
        },
        {
          name: 'Terms of Use',
          link: '/policies/terms/',
        },
      ],
    },
    terms: {
      title: policies.terms.title,
      description: policies.terms.description,
      markdown: policies.terms.markdown.join('\n'),
      related: [
        {
          name: 'Privacy Policy',
          link: '/policies/privacy/',
        },
        {
          name: 'Cookie Policy',
          link: '/policies/cookies/',
        },
      ],
    },
  };

  if (policyPages[request.params.policy] === undefined) return response.status(204).end();
  return response.render('policy.pug', { policy: policyPages[request.params.policy], md, cookies: request.cookies });
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

// Change color theme
app.post('/theme/set/:theme', async (request, response) => {
  response.cookie('theme', request.params.theme.toString());

  return response.status(204).end();
});

// RSS Feed
app.get('/feed/', async (request, response) => {
  let articles = [];

  await crud.findMultipleDocuments('articles', {}).then((result) => {
    articles = result.filter((value) => new Date(value.date) <= new Date());
  });

  articles.sort((a, b) => new Date(b.date) - new Date(a.date));

  const feed = articles.slice(0, 15).map((article) => {
    const date = new Date(article.date);
    return date > new Date() ? 'JJJ' : `<item>
      <title>${article.title}</title>
      <link>//${request.hostname}/blog/article/${article.id}/</link>
      <guid>${article._id.toString()}</guid>
      <pubDate>${weekDaysShort[date.getDay()]}, ${date.getDate()} ${monthsShort[date.getMonth()]} ${date.getFullYear()}</pubDate>
      <description>${article.summary.replace('&nbsp;', ' ').replace(/(<([^>]+)>)/ig, '')}</description>
    </item>`;
  });

  response.type('xml');
  response.send(
    `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <title>See With Eyes Closed</title>
  <description>A blog by Benjamin Hollon.</description>
  <language>en-us</language>
  <copyright>© Benjamin Hollon ${(new Date()).getFullYear()}. All rights reserved.</copyright>
  <link>//${request.hostname}</link>${
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

// Generate sitemap
// if (process.env.NODE_ENV === 'production') setTimeout(() => generator.start(), 0);
