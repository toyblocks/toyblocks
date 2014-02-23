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

  init: function(req, res, next) {
    var _this = this;
    this.request = req;
    this.response = res;
    this.mongodb = req.mongodb;
    this.mongo = req.mongo;

    this.view = new View(this);
    this.view.setOnlyContent(req.param('_view') === 'only_content');

    var isLive = req.headers.host.indexOf("tu-darmstadt.de") > 0;

    if (this.rightLevel >= 0 && isLive) {
      if (!req.session.user) {
        if (!req.param('ticket')) {
          var querystring = require('querystring');
          console.log(req);
          var escaped = querystring.escape(req.originalUrl);
          //res.redirect('/users/log/in?returnto=' + escaped);
          res.redirect('https://sso.hrz.tu-darmstadt.de/login?service=https%3A%2F%2Ftoyblocks.architektur.tu-darmstadt.de' + escaped);
        }
        else {
          // TODO: auslagern
          var https = require('https');
          var fs = require('fs');

          var body = '<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">' +
            '<SOAP-ENV:Header/>' +
            '<SOAP-ENV:Body>' +
              '<samlp:Request xmlns:samlp="urn:oasis:names:tc:SAML:1.0:protocol" MajorVersion="1"' +
                'MinorVersion="1" RequestID="_192.168.16.51.1024506224022"' +
                'IssueInstant="2002-06-19T17:03:44.022Z">' +
                '<samlp:AssertionArtifact>' +
                  req.param('ticket') +
                '</samlp:AssertionArtifact>' +
              '</samlp:Request>' +
            '</SOAP-ENV:Body>' +
          '</SOAP-ENV:Envelope>';

          var options = {
            host: 'sso.hrz.tu-darmstadt.de',
            port: 443,
            path: '/samlValidate',
            method: 'POST',
            headers: {
              'Content-Type': 'text/xml',
              'Content-Length': Buffer.byteLength(body)
            },
          //  ca: [fs.readFileSync('/etc/ssl/certs/TUDchain.pem')]
          };

          var ticket = 'ST-313373-BoHiV6aXTkauzVkUfUJA-sso';
          options.path = '/serviceValidate?service=https%3A%2F%2Ftoyblocks.architektur.tu-darmstadt.de&ticket='+ticket;
          options.method = 'GET';

          var verifyRequest = https.request(options, function(verifyResponse) {
            if (verifyResponse.statusCode != 200) {
              res.render('error-auth', {text:
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
                          rightLevel: 400,
                          _attributes: attributes
                        };
                        _this.mongodb
                          .collection('users')
                          .insert(user, {w: 1}, function(err, result) {
                            req.session.user = user;
                            next();
                          });
                      }
                      else {
                        req.session.user = doc;
                        next();
                      }
                    });
                }
                else {
                  if (jsonResponse['cas:serviceResponse']['cas:authenticationFailure']) {
                    res.render('error-auth', {text:
                      jsonResponse['cas:serviceResponse']['cas:authenticationFailure'].$t +
                      ' (Code: ' +
                      jsonResponse['cas:serviceResponse']['cas:authenticationFailure'].code +
                      ')'
                    });
                  }
                  else {
                    res.render('error-auth', {text: 'Strange response: ' + chunk});
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
        if (req.session.user.rightLevel > this.rightLevel) {
          res.render('error-rights', {title: 'Keine erforderlichen Rechte'});
        }
        next();
      }
    }
    else {
      if (!isLive) {
        req.session.user = {'tuid': 'default', rightLevel: 0};
      }
      next();
    }
  }
};
