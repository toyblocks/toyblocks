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

    this.request = req;
    this.response = res;
    this.mongodb = req.mongodb;
    this.mongo = req.mongo;

    this.view = new View(this);
    this.view.setOnlyContent(req.param('_view') === 'only_content');

    if (this.rightLevel >= 0) {
      if (!req.session.user) {
        var querystring = require('querystring');
        var escaped = querystring.escape(req.originalUrl);
        res.redirect('/users/log/in?returnto=' + escaped);
      }
      else {
        if (req.session.user.rightLevel > this.rightLevel) {
          res.render('error-rights', {title: 'Keine erforderlichen Rechte'});
        }
      }
    }
  }
};
