'use strict';

var BaseController = require('../Base');

module.exports = function () {
};
module.exports.prototype = BaseController.prototype.extend({
  area: 'index',
  name: 'welcome',
  rightLevel: 300,

  indexAction: function() {
    this.view.render({});
  },

});
