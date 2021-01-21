//Use strict for speed and consistency
'use strict';

//Import modules
const express = require("express");
const nodemailer = require('nodemailer');
const bcrypt = require("bcryptjs");
const session = require("express-session");
const compression = require('compression');
const basicAuth = require('express-basic-auth');
const crud = require('./classes/crud');
const get = require('./classes/get');
const post = require('./classes/post');

//Import config
const config = require('./config.json');

var app = express();
var transporter = nodemailer.createTransport(config.nodemailTransport);

//Set up middleware
app.use(express.static('static'));
app.use(session({"secret": config.sessionSecret, "resave": false, "saveUninitialized": false}));
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(compression());
app.use("/admin/", basicAuth({"users": config.admins, "challenge": true}));
app.set('view engine', 'pug');
app.set('views', './templates');
var bcryptSalt;
bcrypt.genSalt(3, function (err, salt) {
  bcryptSalt = salt;
});

// Run GET and POST listeners
const get_listener = new get(request, response)
const post_listener = new post(request, response)

//Listen on port from config.json or process.env.PORT (for the heroku test)
app.listen(process.env.PORT || config.port, () => {
 console.log("Server running on port " + (process.env.port || config.port));
});
