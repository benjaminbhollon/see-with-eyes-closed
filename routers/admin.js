// Require modules
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const MarkdownIt = require('markdown-it');

const md = new MarkdownIt({ html: true });
const { ObjectId } = require('mongodb');

// Local modules
const crud = require('../modules/crud');

// Config
const config = require('../config.json');

const router = express.Router();

// Middleware
router.use(express.json());
router.use(bodyParser.json());

// Routes
router.post('/admin/post/article/', async (request, response) => {
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

// Export
module.exports = router;
