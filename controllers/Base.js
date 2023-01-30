'use strict';

var _ = require('underscore'),
  View = require('../views/Base');

var https = require('https');
var parseString = require('xml2js').parseString;
var querystring = require('querystring');

module.exports = function () { };

module.exports.prototype = {

  name: 'base',
  rightLevel: -1,

  extend: function (child) {
    return _.extend({}, this, child);
  },

  run: function (action) {
    this.action = action;
    this.view.setTemplate(this.area + '/' + this.name + '/' + action);
    var callFunc = action.replace(/(-[a-z])/g, function (v) { return v.replace(/-/, '').toUpperCase(); });
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

  getDbTexts: function (textKeys, callback) {
    if (!Array.isArray(textKeys)) {
      textKeys = [textKeys];
    }
    this.mongodb
      .collection('page_texts')
      .find({ key: { $in: textKeys } })
      .toArray(function (_err, texts) {
        var textsByKey = {};
        for (var i in texts) {
          textsByKey[texts[i].key] = texts[i].text;
        }
        callback(textsByKey);
      });
  },

  addMessage: function (msgType, msgHead, msgText) {
    if (!this.request.session.messages)
      this.request.session.messages = [];
    this.request.session.messages.push({
      type: msgType,
      head: msgHead,
      text: msgText
    });
  },

  getMessages: function () {
    if (this.request.session.messages) {
      var msgs = this.request.session.messages;
      delete this.request.session.messages;
      return msgs;
    }
    else {
      return [];
    }
  },

  getUser: function () {
    return this.request.session.user;
  },

  getPage: function () {
    return parseInt(this.request.query.page) || 1;
  },

  setPagination: function (totalCount, countPerPage) {
    this.paginationTotalCount = totalCount;
    this.paginationCountPerPage = countPerPage;
    this.view.setParam('_paginationPages', Math.ceil(totalCount / countPerPage));
  },

  getPaginationSkip: function () {
    return (this.getPage() - 1) * this.paginationCountPerPage;
  },

  getPaginationLimit: function () {
    return this.paginationCountPerPage;
  },

  getFindParams: function () {
    var result = {};
    var findParamsOr = [];
    var searchParams = this.request.query.search;
    if (searchParams) {
      for (var key in searchParams) {
        var regexParam = {};

        // we want MongoDB to use its regex itself, like that:
        // { "title" : { $regex : "Berlin" , $options : "i"}}
        regexParam[key] = { $regex: searchParams[key], $options: "i" };

        // if the regex is not empty add it
        if (!(JSON.stringify(regexParam) === '{}'))
          findParamsOr.push(regexParam);
      }
      result = { $or: findParamsOr };
    }
    return result;
  },

  getFilterParams: function () {
    var filterKey = this.request.query.filterkey,
      filterQuery = this.request.query.filter,
      filterParams = {},
      filterParamsSecond = {};


    if (filterQuery === undefined || filterKey === '')
      return {};

    if (isNaN(Number(filterQuery))) {
      filterParamsSecond[filterKey] = {};
    } else {
      filterParamsSecond[filterKey] = Number(filterQuery);
    }

    if (filterQuery === '') {
      filterParams[filterKey] = { $regex: '[^()]', $options: 'i' };
    } else {
      filterParams[filterKey] = filterQuery;
    }

    var result = { $or: [filterParams, filterParamsSecond] };
    return result;
  },

  getSortParams: function () {
    var sortQuery = this.request.query.sort,
      direction = this.request.query.sortdirection,
      sortParams = {};

    if (sortQuery === undefined)
      return {};

    if (direction === undefined) {
      sortParams[sortQuery] = 1;
    } else {
      sortParams[sortQuery] = Number(direction);
    }
    return sortParams;
  },

  increaseStat: function (key) {
    var _this = this,
      user = this.getUser();
    if (!user) {
      _this.response.render('error-rights', {
        title: 'Es ist kein Benutzer angemeldet'
      });
      return;
    }

    var incKey = {};
    incKey['stats.' + this.name + '.' + key] = 1;

    if (!user.stats)
      user.stats = {};

    if (!user.stats[this.name])
      user.stats[this.name] = {};

    if (!user.stats[this.name][key])
      user.stats[this.name][key] = 0;

    user.stats[this.name][key]++;

    _this.mongodb.collection('users')
      .updateOne(
        { tuid: user.tuid },
        { $inc: incKey },
        { w: 0 }
      );
  },

  init: function (req, res, next) {
    var _this = this;
    this.request = req;
    this.response = res;
    this.mongodb = req.mongodb;
    this.mongo = req.mongo;
    const password = _this.request.paramNew('password');

    this.view = new View(this);
    if (_this.request.xhr) {
      this.view.setOnlyContent(true);
    }
    else {
      let content = _this.request.query._view === 'only_content';
      this.view.setOnlyContent(content);
    }

    if (_this.request.session.user &&
      _this.request.session.user.right_level >= 300 &&
      !_this.request.session.password_given) {
      _this.request.mongodb.collection('system_config')
        .find({ 'key': 'login_password' })
        .next((_err, doc) => {
          if (password !== doc.value) {
            _this.response.render('login-password', { title: 'Passwort eingeben' });
          } else {
            _this.request.session.password_given = true;
            _this.checkLogin(next);
          }
        });
    }else if (!_this.request.session.user ||
      _this.request.session.user.right_level < 300 ||
      _this.request.session.password_given) {
      _this.checkLogin(next);
    }

  },

  getRightLevel: function () {
    return this.rightLevel;
  },

  checkLogin: function (next) {
    var _this = this;
    var escapedUrl = querystring.escape(_this.request.originalUrl);

    if (process.env.NODE_ENV === 'development') {
      _this.request.session.user = {
        'employee': false,
        'givenName': 'Local',
        'nickname': 'ToyblocksDev',
        'name': 'Local Development',
        'right_level': 300,
        'student': true,
        'surname': 'Development',
        'tuid': 'developer',
        'stats': {
          'sorting': {
            'level1_count_played': 32
          },
          'missing': {
            'level1_count_played': 42
          }
        }
      };
      next();
    } else {
      var nextWithRightsCheck = function () {
        if (_this.request.session.user.right_level > _this.getRightLevel()) {
          _this.response.render('error-rights', { title: 'Keine erforderlichen Rechte' });
        }
        else {
          next();
        }
      };
      if (!_this.request.session.user) {
        //var service = 'https%3A%2F%2Ftoyblocks.architektur.tu-darmstadt.de' + escapedUrl;
        var service = 'https%3A%2F%2Ftoyblocks.architektur.tu-darmstadt.de' + escapedUrl;

        var ticket = _this.request.paramNew('ticket');
        if (!ticket) {
          // let user login via hrz
          _this.response.redirect('https://sso.tu-darmstadt.de/login?service=' + service);
        }
        else {
          // -3 because there is ? or & before which is %3F or %26 escaped
          service = service.substring(0, service.indexOf('ticket%3D' + ticket) - 3);
          
          // hrz sends us back with a ticket
          // SAML 1.1 for /samlValidate POST request
          var body = '' +
            '<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">\n' +
            '    <SOAP-ENV:Header/>\n' +
            '    <SOAP-ENV:Body>\n' +
            '        <samlp:Request xmlns:samlp="urn:oasis:names:tc:SAML:1.0:protocol"' +
            'MajorVersion="1" MinorVersion="1" RequestID="_192.168.16.51.1024506224022"' +
            'IssueInstant="2002-06-19T17:03:44.022Z">\n' +
            '            <samlp:AssertionArtifact>' + ticket + '</samlp:AssertionArtifact>\n' +
            '        </samlp:Request>\n' +
            '    </SOAP-ENV:Body>\n' +
            '</SOAP-ENV:Envelope>\n';

          // /serviceValidate specifiys CAS 2.0
          // See docu for CAS protocol:
          // https://apereo.github.io/cas/4.2.x/protocol/CAS-Protocol.html
          var options = {
            host: 'sso.tu-darmstadt.de',
            port: 443,
            path: '/p3/serviceValidate?service=' + service + '&ticket=' + ticket,
            method: 'GET',
            //headers: {
            //  'Content-Type': 'text/xml',  
            //  'Content-Length': Buffer.byteLength(body)  
            //},
            //body: body,
            // ca: [fs.readFileSync('/etc/ssl/certs/TUDchain.pem')]
          };

          var verifyRequest = https.request(options, function (verifyResponse) {
            if (verifyResponse.statusCode !== 200) {
              _this.response.render('error-auth', {
                text:
                  'HRZ Server scheinen nicht zu funktionieren. Gelieferter Status: ' + verifyResponse.statusCode
              });
            }
            else {
              verifyResponse.setEncoding('utf8');
              verifyResponse.on('data', function (chunk) {

                parseString(chunk, function (_err, jsonResponse) {
                  // Successfull login
                  if (jsonResponse['cas:serviceResponse']['cas:authenticationSuccess']) {
                    var success = jsonResponse['cas:serviceResponse']['cas:authenticationSuccess'][0];
                    var tuid = success['cas:user'][0];
                    var attributes = success['cas:attributes'][0];
                    var affiliation = attributes['cas:eduPersonAffiliation'];
                    var isEmployee = affiliation.includes('employee');
                    var isStudent = affiliation.includes('student');

                    if (tuid === null || tuid === undefined || tuid === "") {
                      _this.response.render('error-auth', { text: 'TU-ID is very strange. Canceling: ' + chunk });
                    }

                    _this.mongodb
                      .collection('users')
                      .find({ 'tuid': tuid })
                      .next(function (_err, doc) {
                        if (!doc) {
                          // insert new user
                          var user = {
                            tuid: tuid,
                            right_level: 300,
                            givenName: attributes['cas:givenName'][0],
                            surname: attributes['cas:surname'][0],
                            employee: isEmployee,
                            student: isStudent,
                            _attributes: attributes
                          };
                          _this.mongodb
                            .collection('users')
                            .insertOne(user, { w: 1 }, function () {
                              _this.request.session.user = user;
                              nextWithRightsCheck();
                            });
                        }
                        else {
                          if (doc.givenName === "" ||
                            doc.givenName === null ||
                            doc.givenName === undefined) {

                            var newuser = {
                              tuid: tuid,
                              right_level: 300,
                              givenName: attributes['cas:givenName'][0],
                              surname: attributes['cas:surname'][0],
                              employee: isEmployee,
                              student: isStudent,
                              _attributes: attributes
                            };

                            _this.mongodb
                              .collection('users')
                              .updateOne(
                                { tuid: tuid },
                                newuser);
                          }
                          _this.request.session.user = doc;
                          nextWithRightsCheck();
                        }
                      });
                  }
                  else {
                    // Login failed
                    if (jsonResponse['cas:serviceResponse']['cas:authenticationFailure']) {
                      _this.response.render('error-auth', {
                        text:
                          jsonResponse['cas:serviceResponse']['cas:authenticationFailure'][0]['_'] + ' (Code: ' +
                          jsonResponse['cas:serviceResponse']['cas:authenticationFailure'][0]['$'].code + ')'
                      });
                    }
                    else {
                      _this.response.render('error-auth', { text: 'Strange response: ' + chunk });
                    }
                  }
                });
              });
            }
          });

          verifyRequest.on('error', function (e) {
            _this.response.render('error-auth', { text: 'Problem with request: ' + e.message });
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
  }
};
