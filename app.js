'use strict';

/**
 * Module dependencies.
 */

var config = require('./configs')(),
    express = require('express'),
    fs = require('fs'),
    http = require('http'),
    https = require('https'),
    path = require('path'),
    cons = require('consolidate'),
    dust = cons.dust,
    mongodb = require('mongodb');

dust.helpers = require('dustjs-helpers');

var app = express();


app.engine('dust', dust);


// development only
if ('development' === config.mode) {

  // set environment to development
  process.env.NODE_ENV = 'development';

  // enable pretty html printing
  app.use(express.errorHandler());
  app.locals.pretty = true;
  dust.helpers.optimizers.format = function(ctx, node) { return node; };
}

// all environments
app.set('port', config.port);
app.set('views', path.join(__dirname, './templates'));
app.set('view engine', 'dust');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({limit: '10mb'}));
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(express.static(path.join(__dirname, './public')));
app.use(app.router);

function getControllerPath(area, controller) {
  return './controllers/' +
    area.toLowerCase() +
    '/' +
    controller.toLowerCase()
    .replace(/(^[a-z]|-[a-z])/g, function(v) {
      return v.replace(/-/,'').toUpperCase();
    });
}

mongodb.MongoClient.connect('mongodb://' + config.mongodb.host + ':' +
    config.mongodb.port + '/' + config.mongodb.db, function(err, db) {
    if(err) {
      console.log('Sorry, there is no mongo db server running.');
    } else {
      // initialize db attaching here
      var attachDB = function(req, res, next) {
        req.mongodb = db;
        req.mongo = mongodb;
        next();
      };

      // we hear on every request url here in form of
      // areaname / controllername / actionname
      // defaults are index in every case. in case of the controller was not
      // found, we try to search in index area
      app.all('/:area?/:controller?/:action?', attachDB, function (req, res, next) {
        var area = req.params.area || 'index',
          controller = req.params.controller || 'index',
          action = req.params.action || 'index',
          controllerClass;

        try{
          try {
            controllerClass = require(getControllerPath(area, controller));
          }
          catch (e) {
            if (e.code === 'MODULE_NOT_FOUND') {
              controllerClass = require(getControllerPath('index', area));
              action = controller || 'index';
            }
          }
          var controllerInstance = new controllerClass;
          controllerInstance.init(req, res, function(){
            controllerInstance.run(action.toLowerCase());
          });
        }catch(e){
          if ('production' === config.mode) {
            res.render('error404', {title: 'Fehler', error: e});
          }
          else {
            throw e;
          }
        }
      });

      http.createServer(app).listen(app.get('port'), function(err){
        if (err) return err;
        console.log('Express server listening on port ' + app.get('port') + ", with UID " + process.getuid());
      });
      if ('production' === config.mode) {
        http.createServer(credentials, app).listen(443, function(){
          console.log('Express server listening on port 443');
        });
      }
    }
  }
);
