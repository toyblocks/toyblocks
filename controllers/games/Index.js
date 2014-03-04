'use strict';

var GamesController = require('../Games');

module.exports = function () {

};
module.exports.prototype = GamesController.prototype.extend({
  name: 'index',

  indexAction: function() {
    var _this = this;

    _this.view.render({
      title: 'Alle Spiele',
      route: '/games'
    });
  }
});
