// Import modules
const express = require('express');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const MarkdownIt = require('markdown-it');
const md = new MarkdownIt({ html: true });
const fetch = require('isomorphic-fetch');
const compression = require('compression');
const basicAuth = require('express-basic-auth');
const cookieParser = require('cookie-parser');

// Import emails, messages, and policies
const emails = require('./lib/emails.json');
const messages = require('./lib/messages.json');
const policies = require('./lib/policies.json');

// Import config
const config = require('./config.json');
const directory = require('./directory.json');

// Import local modules
const crud = require('./modules/crud');
const validate = require('./modules/validate');

const app = express();
const transporter = nodemailer.createTransport(config.nodemailTransport);

// Set up middleware
app.use(cookieParser());
app.use(express.static('static'));
app.use(session({ secret: config.sessionSecret, resave: false, saveUninitialized: false }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(compression());
app.use('/admin/', basicAuth({ users: config.admins, challenge: true }));
app.set('view engine', 'pug');
app.set('views', './templates');
let bcryptSalt;
bcrypt.genSalt(3, (err, salt) => {
  bcryptSalt = salt;
});

// Templates in directory
app.get('*', (request, response, next) => {
  if (directory[request.path] !== undefined) {
    return response.render(directory[request.path], { parameters: request.query, config });
  }

  if (next) return next();
  return response.status(404).end();
});

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

  return response.render('blogmain', {
    recent: recentHTML, popular: popularHTML, parameters: request.query, md,
  });
});

// Blog articles
app.get('/blog/article/:articleId/', async (request, response) => {
  let article;
  let articles;
  await crud.findMultipleDocuments('articles', {}).then((result) => {
    article = result.find((a) => a.id.toUpperCase() === request.params.articleId.toUpperCase());

    articles = result;
  });
  if (article === undefined) return response.status(404).end();

  if (!request.session.viewed) {
    article.hits += 1;
    crud.updateDocument('articles', { id: new RegExp(`^${request.params.articleId}$`, 'i') }, { hits: article.hits });
    request.session.viewed = true;
  }

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
  let data = article.comments;
  let keys = Object.keys(data);
  let values = Object.values(data);
  for (let i = 0; i < keys.length; i += 1) {
    values[i].time = `${timeSince(values[i].time * 1000)} ago`;
  }

  // Similar Articles
  // TECH DEBT: Use the database to select all by tag for performance.
  let related = [];
  let matches;

  data = articles;
  keys = Object.keys(data);
  values = Object.values(data);

  for (let i = 0; i < keys.length; i += 1) {
    if (values[i].id !== article.id) {
      matches = 0;

      const matchingTags = values[i].tags;
      const tagKeys = Object.keys(matchingTags);

      for (let j = 0; j < tagKeys.length; j += 1) {
        if (values[i].tags.indexOf(values[i].tags[j]) !== -1) matches += 1;
      }
      values[i].matches = matches;
      related.push(values[i]);
    }
  }
  related.sort((a, b) => b.matches - a.matches);
  related = related.slice(0, 5);

  return response.render('blogarticle', {
    article,
    related,
    siteKey: config.reCAPTCHApublic,
    parameters: request.query,
    md,
  });
});

// Add comment
app.post('/blog/article/:articleId/comment', async (request, response) => {
  if (!request.body.name || !request.body.comment || (request.body.comment && request.body.comment.length > 512) || (request.body.name && request.body.name.length > 128)) return response.redirect(302, `/blog/article/${request.params.articleId}/#comment-form?err=${400}&name=${encodeURIComponent(request.body.name)}&comment=${encodeURIComponent(request.body.comment)}`);
  let reCAPTCHAvalid = false;

  await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${config.reCAPTCHAprivate}&response=${request.body['g-recaptcha-response']}`, {
    method: 'post',
  }).then((result) => {
    result.json();
  }).then((googleResponse) => {
    reCAPTCHAvalid = googleResponse;
  });

  if (!reCAPTCHAvalid) {
    const url = `/blog/article/${request.params.articleId}/#comment-form?err=${401}${request.params.articleId}&name=${encodeURIComponent(request.body.name)}&comment=${encodeURIComponent(request.body.comment)}`;
    return response.redirect(302, url);
  }

  let article;
  await crud.findDocument('articles', { id: request.params.articleId }).then((result) => {
    article = result;
  });

  if (article === null) response.status(404).end();

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

  return response.redirect(302, `/blog/article/${request.params.articleId}/#comment-form`);
});

// Subscribe
app.post('/blog/subscribe/', async (request, response) => {
  if (!validate.email(request.body.email)) return response.render('subscribe', { success: false, message: 'You must provide a valid email address.' });

  let check;
  await crud.findDocument('subscribers', { email: request.body.email.toLowerCase() }).then((result) => {
    check = result;
  });

  if (check !== null) {
    return response.render('subscribe', {
      success: false,
      message: messages.already_subscribed,
    });
  }

  const subscribeObject = {
    name: request.body.name.toString(),
    email: request.body.email.toLowerCase(),
    subscribedTo: {
      blog: true,
    },
  };

  await crud.insertDocument('subscribers', subscribeObject);

  response.cookie('subscribed', true, {maxAge: 1000 * 60 * 60 * 24 * 182});

  const message = {
    from: emails.new_subscriber.from,
    to: subscribeObject.email,
    subject: emails.new_subscriber.subject,
    html: emails.new_subscriber.html
      .replace('$EMAIL', subscribeObject.email)
      .replace('$TOKEN', await bcrypt.hash(subscribeObject.email, 1)),
  };
  await transporter.sendMail(message, (err) => {
    if (err) {
      console.error(err);
    }
  });

  return response.redirect(302, '/blog/?justSubscribed=true');
});

// Unsubscribe
app.get('/blog/unsubscribe/', async (request, response) => {
  let { title } = messages.unsubscribe_success;
  let { message } = messages.unsubscribe_success;
  let isValid = false;
  await bcrypt.compare(request.query.email, request.query.token).then((result) => {
    isValid = result;
  });

  if (!isValid) {
    title = messages.unsubscribe_error.title;
    message = messages.unsubscribe_error.message;
  } else {
    await crud.deleteDocument('subscribers', { email: request.query.email.toLowerCase() });
  }

  return response.render('layout', { title, content: message });
});

// Projects homepage
app.get('/projects/', async (request, response) => {
  let projects = [];
  await crud.findMultipleDocuments('projects', {}).then((result) => {
    projects = result;
  });
  response.render('projectsmain', { projects, md });
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

  return response.render('writingmain', { writing, md });
});

// Literary work display page
app.get('/writing/:workId/', async (request, response) => {
  let work = {};
  await crud.findDocument('writing', { id: request.params.workId }).then((result) => {
    work = result;
  });

  if (work === null || work.published === false || work.published.website !== true) {
    return response.status(404).end();
  }

  return response.render('writingwork', {
    work,
    title: work.title,
    metaDescription: md.render(work.synopsis.split('\n\n')[0]).replace(/(<([^>]+)>)/ig, ''),
    md,
  });
});

// Post article
app.post('/admin/post/article/', async (request, response) => {
  const today = new Date();
  const months = ['January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'];
  const article = {
    id: request.body.id,
    title: request.body.title,
    author: request.body.author,
    date: `${months[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`,
    image: request.body.image.toString(),
    summary: request.body.summary,
    content: request.body.content,
    tags: request.body.tags.split(',').map((tag) => tag.trim()),
    comments: (request.body.comments ? [] : false),
    hits: 0,
  };

  await crud.insertDocument('articles', article);

  return response.redirect(302, `/blog/article/${request.body.id}/`);
});

// Contact me
app.post('/contact/send/', async (request, response) => {
  const message = {
    from: 'noreply@seewitheyesclosed.com',
    to: config.email,
    subject: request.body.subject.toString(),
    text: `Message from ${request.body.email.toString()}:${request.body.message.toString()}`,
  };
  await transporter.sendMail(message, (err) => {
    if (err) {
      console.error(err);
    }
  });

  return response.redirect(302, '/contact/?success=true');
});

// Policies
app.get('/policies/:policy/', (request, response) => {
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
  return response.render('policy', { policy: policyPages[request.params.policy], md });
});

// Redirects
app.get('/projects/learnclef/', (request, response) => response.redirect(301, '/projects/learn-clef/'));

// Listen on port from config.json or process.env.PORT (for the heroku test)
app.listen(process.env.PORT || config.port, () => {
  console.log(`Server running on port ${process.env.port || config.port}`);
});
