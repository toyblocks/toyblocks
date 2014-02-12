'use strict';

var BaseController = require('./Base');

module.exports = function () {

};
module.exports.prototype = BaseController.prototype.extend({
  area: 'encyclopedia',

  checkAuth: function() {
    return true;
  }
});
