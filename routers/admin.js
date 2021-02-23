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
router.post('/post/article/submit', async (request, response) => {
  console.log('HELLO???');
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
