'use strict';

var _ = require('underscore'),
    View = require('../views/Base');

module.exports = function() {

};
module.exports.prototype = {

  name: 'base',
  rightLevel: -1,

  extend: function(child) {
    return _.extend({}, this, child);
  },

  run: function(action) {
    this.action = action;
    this.view.setTemplate(this.area + '/' + this.name + '/' + action);
    var callFunc = action.replace(/(-[a-z])/g, function(v) { return v.replace(/-/,'').toUpperCase();});
    if (this[callFunc + 'Action']) {
      this[callFunc + 'Action']();
    }
    else {
      var e = new Error('Action "' + callFunc + 'Action" was not found in controller "' + this.name + '"');
      e.code = 'ACTION_NOT_FOUND';
      throw e;
    }
    // can not render view here, because most of the time the db requests are async
  },

  getUser: function() {
    return this.request.session.user;
  },

  getPage: function() {
    return parseInt(this.request.param('page')) || 1;
  },

  setPagination: function(totalCount, countPerPage) {
    this.paginationTotalCount = totalCount;
    this.paginationCountPerPage = countPerPage;
    this.view.setParam('_paginationPages', Math.ceil(totalCount / countPerPage));
  },

  getPaginationSkip: function() {
    return (this.getPage() - 1 ) * this.paginationCountPerPage;
  },

  getPaginationLimit: function() {
    return this.paginationCountPerPage;
  },

  increaseStat: function(key) {
    var _this = this,
      user = this.getUser();
    if (!user)
      throw new Error('there is no user logged in');

    var incKey = {};
    incKey['stats.' + this.name + '.' + key] = 1;

    _this.mongodb.collection('users')
      .update(
        {tuid: user.tuid},
        {$inc: incKey},
        {w:0}
      );
    
    if (!user.stats)
      user.stats = {};
    
    if (!user.stats[this.name])
      user.stats[this.name] = {};

    user.stats[this.name][key] ++;
  },

  init: function(req, res, next) {
    var _this = this;
    this.request = req;
    this.response = res;
    this.mongodb = req.mongodb;
    this.mongo = req.mongo;

    this.view = new View(this);
    if (_this.request.xhr) {
      this.view.setOnlyContent(true);
    }
    else {
      this.view.setOnlyContent(_this.request.param('_view') === 'only_content');
    }

    if (_this.request.session.user &&
        _this.request.session.user.right_level >= 300 &&
        !_this.request.session.password_given)
    {
      _this.request.mongodb.collection('system_config')
        .find({'key': 'login_password'})
        .nextObject(function(err, doc) {
          if (_this.request.param('password') !== doc.value) {
            _this.response.render('login-password', {title: 'Passwort eingeben'});
          }
          else {
            _this.request.session.password_given = true;
            _this.checkLogin(next);
          }
        });
    }

    if (!_this.request.session.user ||
        _this.request.session.user.right_level < 300 ||
        _this.request.session.password_given)
    {
      _this.checkLogin(next);
    }
    
  },

  checkLogin: function(next) {
    var _this = this,
        isLive = _this.request.headers.host.indexOf('tu-darmstadt.de') > 0,
        querystring = require('querystring'),
        escapedUrl = querystring.escape(_this.request.originalUrl);

    if (this.rightLevel >= 0 && isLive) {
      var nextWithRightsCheck = function() {
        if (_this.request.session.user.right_level > _this.rightLevel) {
          _this.response.render('error-rights', {title: 'Keine erforderlichen Rechte'});
        }
        else {
          next();
        }
      };
      if (!_this.request.session.user) {
          var service = 'https%3A%2F%2Ftoyblocks.architektur.tu-darmstadt.de' + escapedUrl,
          ticket = _this.request.param('ticket');
        if (!ticket) {
          //_this.response.redirect('/users/log/in?returnto=' + escapedUrl);
          // let user login via hrz
          _this.response.redirect('https://sso.hrz.tu-darmstadt.de/login?service=' + service);
        }
        else {
          // -3 because there is ? or & before which is %3F or %26 escaped
          service = service.substr(0, service.indexOf('ticket%3D' + ticket) - 3);
          // hrz sends us back with a ticket
          // TODO: auslagern
          var https = require('https');

          // not needed, but prepared for the future
          var body = '<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">' +
            '<SOAP-ENV:Header/>' +
            '<SOAP-ENV:Body>' +
              '<samlp:Request xmlns:samlp="urn:oasis:names:tc:SAML:1.0:protocol" MajorVersion="1"' +
                'MinorVersion="1" RequestID="_192.168.16.51.1024506224022"' +
                'IssueInstant="2002-06-19T17:03:44.022Z">' +
                '<samlp:AssertionArtifact>' +
                  ticket +
                '</samlp:AssertionArtifact>' +
              '</samlp:Request>' +
            '</SOAP-ENV:Body>' +
          '</SOAP-ENV:Envelope>';

          var options = {
            host: 'sso.hrz.tu-darmstadt.de',
            port: 443,
            path: '/serviceValidate?service=' + service + '&ticket=' + ticket,
            method: 'GET',
            headers: {
              'Content-Type': 'text/xml',
              'Content-Length': Buffer.byteLength(body)
            },
          //  ca: [fs.readFileSync('/etc/ssl/certs/TUDchain.pem')]
          };

          var verifyRequest = https.request(options, function(verifyResponse) {
            if (verifyResponse.statusCode != 200) {
              _this.response.render('error-auth', {text:
                'HRZ Server scheinen nicht zu funktionieren. Gelieferter Status: ' + verifyResponse.statusCode});
            }
            else {
              verifyResponse.setEncoding('utf8');
              verifyResponse.on('data', function (chunk) {
                //console.log('STATUS: ' + verifyResponse.statusCode);
                //console.log('HEADERS: ' + JSON.stringify(verifyResponse.headers));
                //console.log('BODY: ' + chunk);
                var xml2json = require('xml2json');
                var jsonResponse = JSON.parse(xml2json.toJson(chunk));
                if (jsonResponse['cas:serviceResponse']['cas:authenticationSuccess']) {
                  var tuid = jsonResponse['cas:serviceResponse']['cas:authenticationSuccess']['cas:user'],
                    attributes = jsonResponse['cas:serviceResponse']['cas:authenticationSuccess']['cas:attributes'];

                  _this.mongodb
                    .collection('users')
                    .find({'tuid': tuid})
                    .nextObject(function(err, doc) {
                      if (!doc) {
                        // insert new user
                        var user = {
                          tuid: tuid,
                          right_level: 300,
                          givenName: attributes['cas:givenName'],
                          surname: attributes['cas:surname'],
                          employee: (attributes['cas:eduPersonAffiliation'].indexOf('employee') >= 0),
                          student: (attributes['cas:eduPersonAffiliation'].indexOf('student') >= 0),
                          _attributes: attributes
                        };
                        _this.mongodb
                          .collection('users')
                          .insert(user, {w: 1}, function(err, result) {
                            _this.request.session.user = user;
                            nextWithRightsCheck();
                          });
                      }
                      else {
                        _this.request.session.user = doc;
                        nextWithRightsCheck();
                      }
                    });
                }
                else {
                  if (jsonResponse['cas:serviceResponse']['cas:authenticationFailure']) {
                    _this.response.render('error-auth', {text:
                      jsonResponse['cas:serviceResponse']['cas:authenticationFailure'].$t +
                      ' (Code: ' +
                      jsonResponse['cas:serviceResponse']['cas:authenticationFailure'].code +
                      ')'
                    });
                  }
                  else {
                    _this.response.render('error-auth', {text: 'Strange response: ' + chunk});
                  }
                }
              });
            }
          });

          verifyRequest.on('error', function(e) {
            console.log('problem with request: ' + e.message);
          });

          // write data to request body
          verifyRequest.write(body);
          verifyRequest.end();
        }
      }
      else {
        nextWithRightsCheck();
      }
    }
    else {
      if (!isLive) {
        _this.request.session.user = {
          'employee' : false,
          'givenName' : 'Mansur',
          'name' : 'Mansur Iqbal',
          'right_level' : 100,
          'student' : true,
          'surname' : 'Iqbal',
          'tuid' : 'm_iqbal',
          'stats': {
            'sorting': {
              'level1_count_played': 32
            },
            'missing': {
              'level1_count_played': 42
            }
          }
        };
      }
      next();
    }
  }
};
