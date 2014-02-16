'use strict';

var BaseController = require('./Base');

module.exports = function () {

};
module.exports.prototype = BaseController.prototype.extend({
  area: 'games',
  rightLevel: 300,

  checkAuth: function() {
    return true;
  }
});
