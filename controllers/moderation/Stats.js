'use strict';

var BaseController = require('../Moderation');

module.exports = function () {

};
module.exports.prototype = BaseController.prototype.extend({
  name: 'stats',

  indexAction: function() {
    var _this = this;
    _this.view.render({
      title: 'Statistiken',
      route: '/moderation/stats'
    });
  }

  insertStats: function (game, gameid, player, result) {
    var _this = this;

    _this.mongodb
    .collection('stats')
    .insert({
      date: new Date(),
      game: game,
      gameid: gameid,
      player: player.tuid,
      result: result
    });
  }
});
