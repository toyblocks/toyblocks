'use strict';

var BaseController = require('../Admin');

module.exports = function () {

};
module.exports.prototype = BaseController.prototype.extend({
  name: 'easy',

  indexAction: function() {
    var _this = this;
    _this.view.render({
      title: 'Spiel hinzufügen'
    });
  },

  missingAction: function() {
    var _this = this;
    _this.view.render({
      title: 'Fehlstellenspiel hinzufügen'
    });
  }
});