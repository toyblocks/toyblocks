'use strict';

var AdminController = require('../Admin');

module.exports = function () {

};
module.exports.prototype = AdminController.prototype.extend({
  name: 'stats',

  indexAction: function() {
    var _this = this,
      week = _this.request.param('week'),
      today = new Date(),
      day = 86400000,
      current,
      weekstart,
      weekend;
    
    // Calculate the start of the week (monday)
    // and generate two dates, week and weekend
    // which span the whole week, from monday
    // 00:00 to next week monday 00:00
    if(typeof week === 'undefined' || week === ''){
      current = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    }else{
      current = new Date(parseInt(week,10));
    }
    weekstart = current.getDate() - ((current.getDay() + 6) %7);
    week = new Date(current.setDate(weekstart));
    weekend = new Date(current.setDate(weekstart + 7));


    _this.mongodb
    .collection('statistics')
    .find({date: {$gte: week, $lt: weekend}})
    .sort({date:1})
    .toArray(
      function (err, elements) {
        var gamesOnDay = [0,0,0,0,0,0,0];
        for (var i = elements.length - 1; i >= 0; i--) {
          gamesOnDay[Math.floor(parseInt(
            weekend.valueOf() - elements[i].date.valueOf()) / day)]++;
        }
        gamesOnDay = gamesOnDay.reverse();
        for (var i = gamesOnDay.length - 1; i >= 0; i--) {
          gamesOnDay[i] = { "count":gamesOnDay[i],"day": i};
        }
        var toDateObject = [{
          "year":weekend.getFullYear(),
          "month":weekend.getMonth()+1,
          "day":weekend.getDate()-1
        }];
        var fromDateObject = [{
          "year":week.getFullYear(),
          "month":week.getMonth()+1,
          "day":week.getDate()
        }];
      _this.view.render({
        title: 'Statistiken',
        elements: elements,
        gamesCount: gamesOnDay,
        from: fromDateObject,
        to: toDateObject,
        previousWeek: (week.setDate(week.getDate()-6)).valueOf(),
        nextWeek: weekend.valueOf()
      });
    })
  },

  monthAction: function() {
    var _this = this,
      month = _this.request.param('month'),
      today = new Date(),
      day = 86400000,
      current,
      monthstart,
      monthend;
    
    // same as indexAction but with months
    if(typeof month === 'undefined' || month === ''){
      current = new Date(today.getFullYear(), today.getMonth(), 1);
    }else{
      current = new Date(parseInt(month,10));
    }
    month = new Date(current);
    monthend = new Date(current.setMonth(current.getMonth() + 1));

    // TODO: refactor
    _this.mongodb
    .collection('statistics')
    .find({date: {$gte: month, $lt: monthend}})
    .sort({date:1})
    .toArray(
      function (err, elements) {
        var gamesOnDay = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
        for (var i = elements.length - 1; i >= 0; i--) {
          gamesOnDay[Math.floor(parseInt(
            monthend.valueOf() - elements[i].date.valueOf()) / day)]++;
        }
        gamesOnDay = gamesOnDay.reverse();
        for (var i = gamesOnDay.length - 1; i >= 0; i--) {
          gamesOnDay[i] = { "count":gamesOnDay[i],"day": i};
        }
        var toDateObject = [{
          "year":monthend.getFullYear(),
          "month":monthend.getMonth()+1,
          "day":monthend.getDate()
        }];
        var fromDateObject = [{
          "year":month.getFullYear(),
          "month":month.getMonth()+1,
          "day":month.getDate()
        }];
      _this.view.render({
        title: 'Statistiken',
        elements: elements,
        gamesCount: gamesOnDay,
        from: fromDateObject,
        to: toDateObject,
        previousmonth: (month.setMonth(month.getMonth()-1)).valueOf(),
        nextmonth: monthend.valueOf()
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
