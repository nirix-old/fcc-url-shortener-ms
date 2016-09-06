//
// FCC URL Shortener Microservice
// Copyright (C) 2016 Nirix
//
var express = require('express');
var mongoose = require('mongoose');
var validUrl = require('valid-url');
var shortId = require('shortid');
var router = express();

// Configuration
var config = {
  baseUrl: process.env.BASE_URL || 'http://localhost:' + (process.env.PORT || 3000),
  mongo: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost/fcc-url-shortener',
    options: {
      db: {
        safe: true
      }
    }
  }
};

// Mongoose
mongoose.connect(config.mongo.uri, config.mongo.options);
mongoose.connection.on('error', function(err){
  console.log('Exiting due to MongoDB connection error: ' + err);
  process.exit(-1);
});

// URL model
var urlSchema = new mongoose.Schema({
  original_url: {
    type: String,
    required: true
  },
  url_code: {
    type: String,
    required: true,
    default: shortId.generate
  }
});

var Url = mongoose.model('Url', urlSchema);

router.get('/', function(req, res){
  res.send([
    '<h1>URL Shortener</h1>',
    'Shorten URL:',
    '<code>GET /new/{url}</code><br>',
  ].join('<br>'));
});

router.get('/new/*', function(req, res){
  var originalUrl = req.params[0];

  // Check for a valid URL
  if (!validUrl.isWebUri(originalUrl)) {
    return res.status(400).json({ error: "Invalid URL" });
  }

  // Check if the URL was already shortened otherwise create it
  Url.findOne({ original_url: originalUrl }).exec().then(function(url){
    if (url) {
      res.json({
        original_url: url.original_url,
        short_url: config.baseUrl + '/' + url.url_code
      });
    } else {
      Url.create({ original_url:  originalUrl }, function(err, url){
        if (err) {
          return res.status(500).send(err);
        }

        res.json({
          original_url: url.original_url,
          short_url: config.baseUrl + '/' + url.url_code
        });
      });
    }
  });
});

router.get('/:code', function(req, res){
  Url.findOne({ url_code: req.params.code }).exec().then(function(url){
    if (url) {
      res.redirect(url.original_url);
    } else {
      res.status(404).json({ error: "No URL found" });
    }
  });
});

router.listen(process.env.PORT || 3000, function(){
  console.log('Server listening on port', process.env.PORT || 3000)
});
