'use strict';

var AdminController = require('../Admin');

module.exports = function () {

};
module.exports.prototype = AdminController.prototype.extend({
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
        elements: elements
      });
    })
  },

  insertStats: function (that, gametype, gameid, level, player, attempt, result) {
    var _this = that;

    function fill(n, length) {
      var str = '' + n;
      for (var i = str.length+1; i <= length; i++) {
          str = '0' + str;
      }
      return str;
    }

    var date = new Date();

    var dateObject = [{
      "year":date.getFullYear(),
      "month":fill((date.getMonth()+1),2),
      "day":fill( date.getDate()    ,2),
      "hours": fill( date.getHours() ,2),
      "minutes": fill( date.getMinutes() ,2)
    }];

    console.log("Adding: ", gametype, gameid, level, player, attempt, result, date);

    _this.mongodb
    .collection('statistics')
    .insert({
      date: date,
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
