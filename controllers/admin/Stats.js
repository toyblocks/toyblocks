'use strict';

var AdminController = require('../Admin');

module.exports = function () {

};
module.exports.prototype = AdminController.prototype.extend({
  name: 'stats',

  indexAction: function() {
    var _this = this,
      start = _this.request.param('start'),
      end = _this.request.param('end'),
      current = new Date(),
      oneweek = 604800000;
      
    // TODO: normalize given date with modulo
    if(typeof start === 'undefined' && typeof end === 'undefined' ){
      start = new Date(current.valueOf()-oneweek);
      end = current;
    }else if(typeof start === 'undefined'){
      start = new Date(end.valueOf() + oneweek);
    }else if(typeof end === 'undefined'){
      end = new Date(start.valueOf() + oneweek);
    }
    _this.mongodb
    .collection('statistics')
    .find({date: {$gte: start, $lt: end}})
    .toArray(
      function (err, elements) {

        // irgendwie sowas in der art
        // spiele pro tag zählen
        // und für die letzten 7 tage in gamesOnDay reinstecken
        elements = elements.sort(function (e) {return e.date.valueOf()});
        var gamesOnDay = [0,0,0,0,0,0,0];
        var c = 0;
        var day = 1000 * 60 * 60 * 24;
        for (var i = elements.length - 1; i >= 0; i--) {
          gamesOnDay[(parseInt(parseInt(end.valueOf()-elements[i].date.valueOf())/day))]++;
        }

        // TODO, check if it is in the right order
        for (var i = gamesOnDay.length - 1; i >= 0; i--) {
          gamesOnDay[i] = { "count":gamesOnDay[i],"day": i}; //end.valueOf()+day*(i+1)};
        }
      _this.view.render({
        title: 'Statistiken',
        elements: elements,
        gamesCount: gamesOnDay,
        startdate: start.valueOf(),
        enddate: end.valueOf()
      });
    })
  },
  tableAction: function() {
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
  dailyAction: function() {
    var _this = this;
    
    _this.mongodb
    .collection('statistics')
    .find({gametype: 'daily'})
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

    var date = new Date();
/*
    var dateObject = [{
      "year":date.getFullYear(),
      "month":date.getMonth(),
      "day":date.getDate()   ,
      "hours": date.getHours(),
      "minutes": date.getMinutes()
    }];
*/
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
