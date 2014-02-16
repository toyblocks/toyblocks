'use strict';

var BaseController = require('./Base');

module.exports = function () {

};
module.exports.prototype = BaseController.prototype.extend({
  area: 'admin',
  rightLevel: 100,

  checkAuth: function() {
    return true;
  }
});
