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

/*
  index2Action: function() {
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
      current = new Date(today.getFullYear(),
                         today.getMonth(),
                         today.getDate());
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
        var index = 0;
        for (var i = week.valueOf(); i < weekend.valueOf(); i = i + day) {
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
          index++;
        }


        var toDateObject = [{
          'year'  : weekend.getFullYear(),
          'month' : weekend.getMonth()+1,
          'day'   : weekend.getDate()-1
        }];
        var fromDateObject = [{
          'year'  : week.getFullYear(),
          'month' : week.getMonth()+1,
          'day'   : week.getDate()
        }];

        var renderNextWeek = false;
        if(weekend.valueOf() < today.valueOf()){
          renderNextWeek = true;
        }


        _this.view.render({
          title: 'Statistiken',
          elements: elements,
          gamesCount: gamesOnDay,
          from: fromDateObject,
          to: toDateObject,
          renderNextWeek: renderNextWeek,
          previousWeek: (week.setDate(week.getDate()-6)).valueOf(),
          nextWeek: weekend.valueOf()
        });
      });
  },
*/
  indexAction: function() {
    var _this = this,
      month = _this.request.param('month'),
      today = new Date(),
      day = 86400000,
      current,
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

        /*
        data:
labels:   ["1.1", "2.1", "3.1", etc]
assemble: [ 0, 1, 23, 32, 12, 23, 1 , 32, 32, 32, 32, 32, 3, 2, 32, etc];
missing:  [ 0, 1, 23, 32, 12, 23, 1 , 32, 32, 32, 32, 32, 3, 2, 32, etc];
sorting:  [ 0, 1, 23, 32, 12, 23, 1 , 32, 32, 32, 32, 32, 3, 2, 32, etc];
mc:       [ 0, 1, 23, 32, 12, 23, 1 , 32, 32, 32, 32, 32, 3, 2, 32, etc];
daily:    [ 0, 1, 23, 32, 12, 23, 1 , 32, 32, 32, 32, 32, 3, 2, 32, etc];
        */

        var assemble = [],
            missing = [],
            sorting = [],
            multiplechoice = [],
            daily = [],
            labels = [],
            all = [],
            index = 0;


        var today = new Date(),
          current = new Date(today.getFullYear(),
                             today.getMonth(),
                             today.getDate());

        for (var i = month.valueOf(); i < monthend.valueOf(); i = i + day) {
          var count_multiplechoice = 0,
            count_assemble = 0,
            count_sorting = 0,
            count_missing = 0,
            count_daily = 0;

          var count = 0;
          for (var j = 0; j < elements.length; j++) {
            if((elements[j].date.valueOf() === i) || ((elements[j].date.valueOf() - i) === -82800000)){
              count_sorting += num(elements[j].sorting);
              count_missing += num(elements[j].missing);
              count_assemble += num(elements[j].assemble);
              count_multiplechoice += num(elements[j].multiplechoice);
              count_daily += num(elements[j].daily);
            }
          }
          multiplechoice.push(count_multiplechoice);
          assemble.push(count_assemble)
          sorting.push(count_sorting);
          missing.push(count_missing);
          daily.push(count_daily);
          all.push((count_multiplechoice + count_assemble + count_sorting + count_missing + count_daily));

          labels.push(String(new Date(i).getDate()) +
                      '.' +
                      String(new Date(i).getMonth() + 1));
        }


        var toDateObject = [{
          'year':monthend.getFullYear(),
          'month':monthend.getMonth()+1,
          'day':monthend.getDate()
        }];
        var fromDateObject = [{
          'year':month.getFullYear(),
          'month':month.getMonth()+1,
          'day':month.getDate()
        }];

        var renderNextWeek = false;
        if(monthend.valueOf() < today.valueOf()){
          renderNextWeek = true;
        }

        _this.view.render({
          title: 'Statistiken',
          multiplechoice: multiplechoice,
          assemble: assemble,
          sorting: sorting,
          missing: missing,
          all: all,
          daily: daily,
          labels: labels,
          from: fromDateObject,
          to: toDateObject,
          renderNextWeek: renderNextWeek,
          previousmonth: (month.setMonth(month.getMonth()-1)).valueOf(),
          nextmonth: monthend.valueOf()
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
    });
  },


  insertStats: function (db, gametype) {
    var today = new Date();
    var currentDay = new Date(today.getFullYear(),
                         today.getMonth(),
                         today.getDate(), 0, 0, 0, 0);
    // create new entry if no entry is found
     db.mongodb
          .collection('statistics')
          .update({date: currentDay},
                  gametype,
                  {upsert : true}, function (err) {
                    if(err) console.log(err);
                  });
  }
});
