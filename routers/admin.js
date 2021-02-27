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

  response.render('managearticles', {articles});
});

router.get('/manage/articles/:articleId/', async (request, response) => {
  let article = {};
  await crud.findDocument('articles', {'id': request.params.articleId}).then((result) => {
    article = result;
  });
  if (article === null) response.status(404).end();

  response.render('editarticle', {article});
});

router.post('/manage/articles/:articleId/', async (request, response) => {
  let article = {
    title: request.body.title,
    author: request.body.author,
    date: (request.body.date ? request.body.date : `${months[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`),
    image: request.body.image.toString(),
    summary: request.body.summary,
    content: request.body.content,
    tags: request.body.tags.split(',').map((tag) => tag.trim()),
  };
  await crud.findDocument('articles', {id: request.params.articleId}).then((result) => {
    if ((result.comments !== false) !== request.body.comments)
      article.comments = (request.body.comments ? [] : false);
  });

  await crud.updateDocument('articles', {id: request.params.articleId}, article);

  response.redirect(302, '/admin/manage/articles/');
});

router.post('/post/article/submit', async (request, response) => {
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

// Export
module.exports = router;
