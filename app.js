/**
 * Module dependencies.
 */
var config = require('./configs');
var express = require('express');
var http = require('http');
//var https = require('https');
var path = require('path');
var cons = require('consolidate');
var dust = cons.dust;
var mongodb = require('mongodb');
var jobs = require('./jobs');
var logger = require('morgan');
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
var session = require('cookie-session');
var favicon = require('serve-favicon');
var underscore = require('underscore');

dust.helpers = require('dustjs-helpers');

var app = express();
app.engine('dust', dust);

if (process.env.NODE_ENV === 'development') {
  // enable html pretty printing
  app.locals.pretty = true;
}

// all environments
app.set('port', config.port);
app.set('views', path.join(__dirname, './templates'));
app.set('view engine', 'dust');
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));
app.use(methodOverride());
app.use(cookieParser(config.secret));
app.use(session({
  secret: config.secret,
  resave: false,
  saveUninitialized: false
}));
var oneDay = 86400000;
app.use(express.static(path.join(__dirname, 'public'), { maxAge: oneDay * 30 }));

/**
*  getControllerPath() creates controller url path
*
* @param <String> area
* @param <String> controller
* @return <String> path
*/
function getControllerPath(area, controller) {
  return './controllers/' +
    area.toLowerCase() +
    '/' +
    controller.toLowerCase()
      .replace(/(^[a-z]|-[a-z])/g, function (v) {
        return v.replace(/-/, '').toUpperCase();
      });
}

const mongoDbPath = 'mongodb://' + config.mongodb.host + ':' + config.mongodb.port + '/' + config.mongodb.db;

mongodb.MongoClient.connect(mongoDbPath, { useNewUrlParser: true }, function (err, client) {
  if (err) {
    console.error(err);
    console.error('Sorry, there is no mongo db server running.');
  } else {

    const db = client.db('toyblocks');

    // initialize db attaching here
    var attachDB = function (req, _res, next) {
      req.mongodb = db;
      req.mongo = mongodb;
      next();
    };

    // cron scripts (for now only daily challenge) 
    jobs.initJobs(db);

    // we hear on every request url here in form of
    // areaname / controllername / actionname
    // defaults are index in every case. in case of the controller was not
    // found, we try to search in index area
    app.all('/:area?/:controller?/:action?', attachDB,
      function (req, res) {
        var area = req.params.area || 'index',
          controller = req.params.controller || 'index',
          action = req.params.action || 'index',
          ControllerClass;

        /**
         * replacement of deprecated params() function
         * 
         * @param {string} id param name
         * @returns content of either body or query, if none found returns undefined
         */
        req.paramNew = (id) => {
          let res = req.body[id] || req.query[id] ||
          (underscore.isEmpty(req.body.values) ? 
          (underscore.isEmpty(req.query.values) ? undefined : req.query.values[id])
           : req.body.values[id]);
           // console.log("################");
           // console.log("> params", req.params);
           // console.log("> body", req.body);
           // console.log("> query", req.query);
           // console.log("> id:", id);
          //console.log("> res:", res);
          return res;
        };

        try {
          try {
            ControllerClass = require(getControllerPath(area, controller));
            //console.log(getControllerPath(area, controller));
          }
          catch (e) {
            if (e.code === 'MODULE_NOT_FOUND') {
              ControllerClass = require(getControllerPath('index', area));
              //console.log(getControllerPath('index', area));
              action = controller || 'index';
            }
          }
          var controllerInstance = new ControllerClass();
          controllerInstance.init(req, res, function () {
            controllerInstance.run(action.toLowerCase());
          });
        } catch (e) {
          if ('production' === app.settings.env) {
            res.render('error404', { title: 'Fehler', error: "Seite nicht gefunden." });
          }
          else {
            console.error("path: ", req.path);
            console.error(e);
            res.render('error404', { title: 'Fehler', error: e.stack });
          }
        }
      });

    http.createServer(app).listen(app.get('port'), function (err) {
      if (err) return err;
      console.log('Express server listening on port ' +
        app.get('port') + ', with PID ' + process.pid +
        ' in ' + app.settings.env + ' mode, with MongoDB ' + mongodb.ServerApiVersion.v1);
    });
  }
}
);
