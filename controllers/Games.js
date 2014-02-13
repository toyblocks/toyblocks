'use strict';

var BaseController = require('./Base');

module.exports = function () {

};
module.exports.prototype = BaseController.prototype.extend({
  area: 'games',
  loginRequired: true,

  checkAuth: function() {
    return true;
  }
});
