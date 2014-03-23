'use strict';

var AdminController = require('../Admin');

function num (arg) {
  if(arg === undefined)
    return 0;
  return Number(arg);
}

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

        // iterate over the week, see if there are is an entry in our
        // collection with played games for that day, add those entrys
        // and save them in gamesOnDay
        var gamesOnDay = [[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0]];
        for (var i = week.valueOf(), index = 0; i < weekend.valueOf(); i = i + day, index++) {
          var count = 0;
          for (var j = 0; j < elements.length; j++) {
            if(elements[j].date.valueOf() === i){
              count = num(elements[j].sorting) +
                       num(elements[j].missing) +
                       num(elements[j].assemble) +
                       num(elements[j].multiplechoice);
              break;
            }
          }
          gamesOnDay[index] = [index,count];
        }

        //TODO: collect the gamesPlayed count for each game individual
        //TODO: and render them on the frontend with flot.stack.js
        //TODO: see http://www.flotcharts.org/flot/examples/stacking/index.html

        var toDateObject = [{
          "year"  : weekend.getFullYear(),
          "month" : weekend.getMonth()+1,
          "day"   : weekend.getDate()-1
        }];
        var fromDateObject = [{
          "year"  : week.getFullYear(),
          "month" : week.getMonth()+1,
          "day"   : week.getDate()
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

    _this.mongodb
    .collection('statistics')
    .find({date: {$gte: month, $lt: monthend}})
    .sort({date:1})
    .toArray(
      function (err, elements) {

        var gamesOnDay = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

        for (var i = month.valueOf(), index = 0; i < monthend.valueOf(); i = i + day, index++) {
          var count = 0;
          for (var j = 0; j < elements.length; j++) {
            if(elements[j].date.valueOf() === i){
              count = num(elements[j].sorting) +
                       num(elements[j].missing) +
                       num(elements[j].assemble) +
                       num(elements[j].multiplechoice);
              break;
            }
          }
          gamesOnDay[index] = [index,count];
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
    var _this = this,
      countPerPage = 20,
      page = _this.getPage();
    
    _this.mongodb
    .collection('statistics')
    .count(function (err1, totalCount) {
      _this.setPagination(totalCount, countPerPage);
      _this.mongodb
      .collection('statistics')
      .find()
      .sort( { $natural: -1 } )
      .skip(_this.getPaginationSkip())
      .limit(_this.getPaginationLimit())
      .toArray(
        function (err, elements) {
        _this.view.render({
          title: 'Statistiken',
          elements: elements
        });
      });
    });
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


  insertStats: function (that, gametype) {
    var today = new Date(),
      current = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    console.log("Adding: ", current, gametype, "+1");

    // create a new entry if no entry contains today
    // also increase by one
    // TODO: dirty switch, replace maybe? 
    // TODO: { $inc : { gametype: +1 } } doesnt work
    switch(gametype){
      case "sorting": 
        that.mongodb
          .collection('statistics')
          .update({date: current},
                  { $inc : { "sorting": +1 } },
                  {upsert : true}, function (err) {
                    if(err) console.log(err);
                  }); break;
      case "assemble":
        that.mongodb
          .collection('statistics')
          .update({date: current},
                  { $inc : { "assemble": +1 } },
                  {upsert : true}, function (err) {
                    if(err) console.log(err);
                  }); break;
      case "multiplechoice":
        that.mongodb
          .collection('statistics')
          .update({date: current},
                  { $inc : { "multiplechoice": +1 } },
                  {upsert : true}, function (err) {
                    if(err) console.log(err);
                  }); break;
      case "missing":
        that.mongodb
          .collection('statistics')
          .update({date: current},
                  { $inc : { "missing": +1 } },
                  {upsert : true}, function (err) {
                    if(err) console.log(err);
                  }); break;
    }
  }

});
