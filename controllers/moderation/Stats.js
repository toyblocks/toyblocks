'use strict';

var BaseController = require('../Moderation');

module.exports = function () {

};
module.exports.prototype = BaseController.prototype.extend({
  name: 'stats',

  indexAction: function() {
    var _this = this;
    
    _this.mongodb
    .collection('statistics')
    .find()
    .toArray(
      function (err, elements) {
      _this.view.render({
        title: 'Statistiken',
        route: '/moderation/stats',
        elements: elements
      });
    })
  },

  insertStats: function (that, gametype, gameid, level, player, attempt, result) {
    var _this = that;
    console.log("Adding: ", gametype, gameid, level, player, attempt, result);

    _this.mongodb
    .collection('statistics')
    .insert({
      date: new Date(),
      gametype: gametype,
      gameid: gameid,
      level: level,
      player: player,
      attempt: attempt,
      result: result
    }, function (err) {
      if(err){
        console.log(err);
      }
    });
  }
});
