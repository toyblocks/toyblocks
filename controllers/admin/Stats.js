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
      oneweek = 604800000,
      day = 86400000;
    
    
    var weekstart = current.getDate() - current.getDay() + 1;
    var weekend = weekstart + 6;
    // TODO: normalize given date with modulo
    if((typeof start === 'undefined' || start === '') && (typeof end === 'undefined' || end === '') ){
      start = new Date(current.setDate(weekstart));
      end = new Date(current.setDate(weekend));
    }else if(typeof start === 'undefined'|| start === ''){
      start = new Date(end.valueOf()-oneweek);
      end = new Date(parseInt(end.valueOf()));
    }else if(typeof end === 'undefined'|| end === ''){
      end = new Date(parseInt(start.valueOf()));
      start = new Date(start.valueOf()-oneweek);
    }
    console.log(start);
    console.log(end);
    _this.mongodb
    .collection('statistics')
    .find({date: {$gte: start, $lt: end}})
    .sort({date:1})
    .toArray(
      function (err, elements) {
        var gamesOnDay = [0,0,0,0,0,0,0];
        for (var i = elements.length - 1; i >= 0; i--) {
          gamesOnDay[(parseInt(parseInt(end.valueOf()-elements[i].date.valueOf())/day))]++;
        }
        gamesOnDay = gamesOnDay.reverse();
        for (var i = gamesOnDay.length - 1; i >= 0; i--) {
          gamesOnDay[i] = { "count":gamesOnDay[i],"day": i};
        }
        var toDateObject = [{
          "year":end.getFullYear(),
          "month":end.getMonth(),
          "day":end.getDate()   ,
          "hours": end.getHours(),
          "minutes": end.getMinutes()
        }];
        var fromDateObject = [{
          "year":start.getFullYear(),
          "month":start.getMonth(),
          "day":start.getDate()   ,
          "hours": start.getHours(),
          "minutes": start.getMinutes()
        }];
      _this.view.render({
        title: 'Statistiken',
        elements: elements,
        gamesCount: gamesOnDay,
        from: fromDateObject,
        to: toDateObject,
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
    //date = new Date(date.setDate(date.getDate() -3));
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
