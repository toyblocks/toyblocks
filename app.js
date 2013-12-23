
/**
 * Module dependencies.
 */

var config = require('./configs')(),
    express = require('express'),
    routes = require('./routes'),
    http = require('http'),
    path = require('path'),
    cons = require('consolidate'),
    dust = cons.dust,
    mongodb = require('mongodb');

dust.helpers = require('dustjs-helpers');

var app = express();

app.engine('dust', dust);


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

// development only
if ('local' === config.mode) {
  app.use(express.errorHandler());
}

function getControllerPath(area, controller) {
  var path = './controllers/' + area.toLowerCase();
      path += '/' +
        controller.toLowerCase()
        .replace(/(^[a-z]|-[a-z])/g,
          function(v) {
            return v.replace(/-/,'').toUpperCase();
          });
  return path;
}

mongodb.MongoClient.connect('mongodb://' + config.mongodb.host + ':' + config.mongodb.port + '/' + config.mongodb.db,
  function(err, db) {
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
      // 
      app.all('/:area?/:controller?/:action?', attachDB, function (req, res, next) {
        var area = req.params.area || 'index',
          controller = req.params.controller || 'index',
          action = req.params.action || 'index';
        try {
          var controllerClass = require(getControllerPath(area, controller));
        }
        catch (e) {
          if (e.code === 'MODULE_NOT_FOUND') {
            try {
              var controllerClass = require(getControllerPath('index', area));
            }
            catch (e) {
              if (e.code === 'MODULE_NOT_FOUND') {
                res.status(404).send('Controller not found');
                return;
              }
              else {
                throw e;
              }
            }
          }
          else {
            throw e;
          }
        }
        var controllerInstance = new controllerClass;
        controllerInstance.init(req, res, next);
        controllerInstance.run(action.toLowerCase());
      });

      http.createServer(app).listen(app.get('port'), function(){
        console.log('Express server listening on port ' + app.get('port'));
      });
    }
  }
);

