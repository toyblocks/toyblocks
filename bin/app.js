
/**
 * Module dependencies.
 */

var express = require('express'),
    routes = require('./routes'),
    http = require('http'),
    path = require('path'),
    cons = require('consolidate'),
    mongodb = require('mongodb');

var app = express();

app.engine('dust', cons.dust);

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'dust');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({limit: '10mb'}));
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, '../public')));

// development only
if ('development' === app.get('env')) {
  app.use(express.errorHandler());
}

mongodb.MongoClient.connect('mongodb://127.0.0.1:27017/toyblocks',
  function(err, db) {
    if(err) {
      console.log('Sorry, there is no mongo db server running.');
    } else {
      var attachDB = function(req, res, next) {
        req.mongodb = db;
        req.mongo = mongodb;
        next();
      };
      app.all('/', routes.index);
      for (var routeName in routes) {
        // register all routes. the routes with undescore will get a * for the path
        app.all('/'+routeName.replace(/_/g, '/')+(routeName.search(/_/g)>0?'/:action?*':''), attachDB, routes[routeName]);
      }
      http.createServer(app).listen(app.get('port'), function(){
        console.log('Express server listening on port ' + app.get('port'));
      });
    }
  }
);

