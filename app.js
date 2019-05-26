'use strict';

/**
 * Module dependencies.
 */

var config = require('./configs'),
    express = require('express'),
    http = require('http'),
    //https = require('https'),
    path = require('path'),
    cons = require('consolidate'),
    dust = cons.dust,
    mongodb = require('mongodb'),
    jobs = require('./jobs');

dust.helpers = require('dustjs-helpers');
// TODO: helpers do not work... why?
dust.helpers.Truncate = function(chunk, context, bodies, params) {
  var data   = dust.helpers.tap(params.data, chunk, context),
      length = dust.helpers.tap(params.length, chunk, context);
  return chunk.write(data.substr(0, length));
};

var app = express();


app.engine('dust', dust);

// in development only
if ('development' === app.settings.env) {

  // enable pretty html printing
  //app.use(express.errorHandler());
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
    .replace(/(^[a-z]|-[a-z])/g, function(v) {
      return v.replace(/-/,'').toUpperCase();
    });
}

const mongoDbPath = 'mongodb://' + config.mongodb.host + ':' + config.mongodb.port + '/' + config.mongodb.db;

mongodb.MongoClient.connect(mongoDbPath, { useNewUrlParser: true }, function(err, client) {
    if(err) {
      console.log(err);
      console.log('Sorry, there is no mongo db server running.');
    } else {

      const db = client.db('toyblocks')
      // initialize db attaching here
      var attachDB = function(req, res, next) {
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

        try{
          try {
            ControllerClass = require(getControllerPath(area, controller));
          }
          catch (e) {
            if (e.code === 'MODULE_NOT_FOUND') {
              ControllerClass = require(getControllerPath('index', area));
              action = controller || 'index';
            }
          }
          var controllerInstance = new ControllerClass();
          controllerInstance.init(req, res, function(){
            controllerInstance.run(action.toLowerCase());
          });
        }catch(e){
          if ('production' === app.settings.env) {
            res.render('error404', {title: 'Fehler', error: e});
          }
          else {
            throw e;
          }
        }
      });

      http.createServer(app).listen(app.get('port'), function(err){
        if (err) return err;
        console.log('Express server listening on port ' +
         app.get('port') + ', with PID ' + process.pid +
          ' in ' + app.settings.env + ' mode');
      });
    }
  }
);