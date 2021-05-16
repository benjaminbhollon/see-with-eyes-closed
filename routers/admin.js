// Require modules
const vocado = require('vocado');
//const bodyParser = require('body-parser');

// Local modules
const config = require('../config.json');
const crud = require('@bibliobone/mongodb-crud').bind(config.mongodbURI, 'swec-core');

const router = vocado.Router();

// Middleware
//router.use(express.json());
//router.use(bodyParser.json());

// Routes
router.get('/manage/articles/', async (request, response) => {
  let articles = [];
  await crud.findMultipleDocuments('articles', {}).then((result) => {
    if (result !== null) articles = result;
  });
  articles.sort((a, b) => new Date(b.date) - new Date(a.date));

  response.render('admin/managearticles.pug', { articles, cookies: request.cookies });
});

router.get('/manage/articles/:articleId/', async (request, response) => {
  let article = {};
  await crud.findDocument('articles', { id: request.params.articleId }).then((result) => {
    article = result;
  });
  if (article === null) return response.render('errors/404.pug', {});

  response.render('admin/editarticle.pug', { article, cookies: request.cookies });
});

router.post('/manage/articles/:articleId/', async (request, response) => {
  const article = {
    title: request.body.title,
    author: request.body.author,
    date: request.body.date,
    image: request.body.image.toString(),
    summary: request.body.summary,
    content: request.body.content,
    tags: request.body.tags.split(',').map((tag) => tag.trim()),
  };
  await crud.findDocument('articles', { id: request.params.articleId }).then((result) => {
    article.comments = (request.body.comments === 'on');
    if (article.comments && result.comments) article.comments = result.comments;
    else article.comments = false;
  });

  await crud.updateDocument('articles', { id: request.params.articleId }, article);

  response.redirect(302, '/admin/manage/articles/');
});

router.get('/manage/articles/:articleId/delete', async (request, response) => {
  await crud.deleteDocument('articles', { id: request.params.articleId });

  response.redirect(302, '/admin/manage/articles');
});

router.get('/manage/comments/', async (request, response) => {
  let articles = [];
  await crud.findMultipleDocuments('articles', {}).then((result) => {
    if (result !== null) articles = result;
  });
  articles.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Comments time ago
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
  articles.map((a) => {
    if (a.comments) {
      const article = a;
      article.comments = article.comments.map((comment) => {
        const newComment = { ...comment };
        newComment.time = `${timeSince(newComment.time * 1000)} ago`;
        return newComment;
      });
      return article;
    }
    return false;
  });

  response.render('admin/managecomments.pug', { articles, cookies: request.cookies });
});

router.get('/manage/comments/:articleId/:index/delete', async (request, response) => {
  let article = {};
  await crud.findDocument('articles', { id: request.params.articleId }).then((result) => {
    article = result;
  });

  if (article === null) return response.render('errors/404.pug', {});

  article.comments.splice(request.params.index, 1);

  await crud.updateDocument('articles', { id: request.params.articleId }, { comments: article.comments });
  response.redirect(302, '/admin/manage/comments/');
});

router.post('/post/article/', async (request, response) => {
  const today = new Date();
  const months = [
    'January',
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
    'December',
  ];
  const article = {
    id: request.body.id,
    title: request.body.title,
    author: request.body.author,
    date: (request.body.date ? request.body.date : `${months[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`),
    image: request.body.image.toString(),
    summary: request.body.summary,
    content: request.body.content,
    tags: request.body.tags.split(',').map((tag) => tag.trim()),
    comments: (request.body.comments ? [] : false),
    hits: 0,
    reactions: [
      {
        name: 'impressive',
        count: 0,
      },
      {
        name: 'funny',
        count: 0,
      },
      {
        name: 'hooray',
        count: 0,
      },
      {
        name: 'silly',
        count: 0,
      },
      {
        name: 'avocado',
        count: 0,
      },
    ],
  };

  await crud.insertDocument('articles', article);

  return response.redirect(302, `/blog/article/${request.body.id}/`);
});

router.get('/manage/writing/', async (request, response) => {
  let writing = [];
  await crud.findMultipleDocuments('writing', {}).then((result) => {
    if (result !== null) writing = result;
  });

  response.render('admin/managewriting.pug', { writing, cookies: request.cookies });
});

router.get('/manage/writing/:workId/', async (request, response) => {
  let work = {};
  await crud.findDocument('writing', { id: request.params.workId }).then((result) => {
    work = result;
  });
  if (work === null) return response.render('errors/404.pug', { cookies: request.cookies });

  response.render('admin/editwriting.pug', { work, cookies: request.cookies });
});

router.post('/manage/writing/:workId/', async (request, response) => {
  const story = {
    title: request.body.title,
    author: request.body.author,
    type: request.body.type,
    event: (request.body.event ? request.body.event : false),
    genre: request.body.genre,
    image: request.body.image,
    synopsis: request.body.synopsis,
    excerpt: request.body.excerpt,
    content: request.body.content,
    characters: [],
    published: (request.body.published === 'on' ? {
      website: request.body.website === 'on',
      link: request.body.link,
    } : false),
    status: request.body.status,
  };

  await crud.updateDocument('writing', { id: request.params.workId }, story);

  response.redirect(302, '/admin/manage/writing/');
});

router.post('/post/writing/', async (request, response) => {
  const story = {
    id: request.body.id,
    title: request.body.title,
    author: request.body.author,
    type: request.body.type,
    event: (request.body.event ? request.body.event : false),
    genre: request.body.genre,
    synopsis: request.body.synopsis,
    excerpt: request.body.excerpt,
    content: request.body.content,
    characters: [],
    published: (request.body.published === 'on' ? {
      website: request.body.website === 'on',
      link: request.body.link,
    } : false),
    status: request.body.status,
  };

  await crud.insertDocument('writing', story);

  response.redirect(302, '/writing/');
});

// Export
module.exports = router;
