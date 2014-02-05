'use strict';

var BaseController = require('./Base');

module.exports = function () {

};
module.exports.prototype = BaseController.prototype.extend({
  area: 'admin',

  checkAuth: function() {
    return true;
  }
});
