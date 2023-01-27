'use strict';

var BaseController = require('../Moderation');

module.exports = function () {

};
module.exports.prototype = BaseController.prototype.extend({
  name: 'index',
  rightLevel: 100,

  indexAction: function () {
    var _this = this;
    _this.view.render({
      title: 'Spiel hinzufügen - ToyBlocks'
    });
  },

  missingAction: function () {
    var _this = this;
    _this.view.render({
      title: 'Fehlstellenspiel hinzufügen - ToyBlocks'
    });
  }
});
