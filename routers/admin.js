// Require modules
const express = require('express');
const bodyParser = require('body-parser');

// Local modules
const crud = require('../modules/crud');

const router = express.Router();

// Middleware
router.use(express.json());
router.use(bodyParser.json());

// Routes
router.get('/manage/articles/', async (request, response) => {
  let articles = [];
  await crud.findMultipleDocuments('articles', {}).then((result) => {
    if (result !== null) articles = result;
  });
  articles.sort((a, b) => new Date(b.date) - new Date(a.date));

  response.render('admin/managearticles', { articles });
});

router.get('/manage/articles/:articleId/', async (request, response) => {
  let article = {};
  await crud.findDocument('articles', { id: request.params.articleId }).then((result) => {
    article = result;
  });
  if (article === null) response.status(404).end();

  response.render('admin/editarticle', { article });
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
    if ((result.comments !== false) !== request.body.comments) {
      article.comments = (request.body.comments ? [] : false);
    }
  });

  await crud.updateDocument('articles', { id: request.params.articleId }, article);

  response.redirect(302, '/admin/manage/articles/');
});

router.get('/manage/articles/:articleId/delete', async (request, response) => {
  await crud.deleteDocument('articles', { id: request.params.articleId });

  response.redirect(302, '/admin/manage/articles');
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
  };

  await crud.insertDocument('articles', article);

  return response.redirect(302, `/blog/article/${request.body.id}/`);
});

router.get('/manage/writing/', async (request, response) => {
  let writing = [];
  await crud.findMultipleDocuments('writing', {}).then((result) => {
    if (result !== null) writing = result;
  });

  response.render('admin/managewriting', { writing });
});

router.get('/manage/writing/:workId/', async (request, response) => {
  let work = {};
  await crud.findDocument('writing', { id: request.params.workId }).then((result) => {
    work = result;
  });
  if (work === null) response.status(404).end();

  response.render('admin/editwriting', { work });
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
      link: request.body.link
    } : false),
    status: request.body.status
  }

  await crud.updateDocument('writing', {id: request.params.workId}, story);

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
      link: request.body.link
    } : false),
    status: request.body.status
  }

  await crud.insertDocument('writing', story);

  response.redirect(302, '/writing/');
});

// Export
module.exports = router;
