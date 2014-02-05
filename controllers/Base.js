'use strict';

var _ = require('underscore'),
    View = require('../views/Base');

module.exports = function() {

};
module.exports.prototype = {
  name: 'base',
  extend: function(child) {
    return _.extend({}, this, child);
  },
  run: function(action) {
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
    this.view = new View(res);
    this.view.setOnlyContent(req.param('_view') === 'only_content');
    this.request = req;
    this.response = res;
    this.mongodb = req.mongodb;
    this.mongo = req.mongo;
  }
};
