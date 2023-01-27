'use strict';

var AdminController = require('../Admin');

function num(arg) {
  if (arg === undefined)
    return 0;
  return Number(arg);
}

module.exports = function () {

};
module.exports.prototype = AdminController.prototype.extend({
  name: 'stats',
  rightLevel: 100,

  /**
  * Shows Index page for statistics
  */
  indexAction: function () {
    var _this = this;
    var month = _this.request.query.month;
    var today = new Date();
    var day = 86400000;
    var current;
    var monthend;

    if (typeof month === 'undefined' || month === '') {
      current = new Date(today.getFullYear(), today.getMonth(), 1);
    } else {
      current = new Date(parseInt(month, 10));
    }
    month = new Date(current);
    monthend = new Date(current.setMonth(current.getMonth() + 1));

    _this.mongodb
      .collection('statistics')
      .find({ date: { $gte: month, $lt: monthend } })
      .sort({ date: 1 })
      .toArray(
        function (_err, elements) {

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
            all = [];


          var today = new Date();

          for (var i = month.valueOf(); i < monthend.valueOf(); i = i + day) {
            var count_multiplechoice = 0,
              count_assemble = 0,
              count_sorting = 0,
              count_missing = 0,
              count_daily = 0;

            for (var j = 0; j < elements.length; j++) {
              if ((elements[j].date.valueOf() === i) ||
                ((elements[j].date.valueOf() - i) === -82800000)) {
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

            labels.push(String(new Date(i).getDate()) + '.' +
              String(new Date(i).getMonth() + 1));
          }


          var toDateObject = [{
            'year': monthend.getFullYear(),
            'month': monthend.getMonth() + 1,
            'day': monthend.getDate()
          }];
          var fromDateObject = [{
            'year': month.getFullYear(),
            'month': month.getMonth() + 1,
            'day': month.getDate()
          }];

          var renderNextWeek = monthend.valueOf() < today.valueOf();

          _this.view.render({
            title: 'Statistiken - ToyBlocks',
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
            previousmonth: (month.setMonth(month.getMonth() - 1)).valueOf(),
            nextmonth: monthend.valueOf()
          });
        });
  },

  dailyAction: function () {
    var _this = this;

    _this.mongodb
      .collection('statistics')
      .find({ gametype: 'daily' })
      .toArray(
        function (_err, elements) {
          _this.view.render({
            title: 'Statistiken - ToyBlocks',
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
      .updateOne({ date: currentDay },
        { $inc: { [gametype]: +1 } },
        { upsert: true }, function (err) {
          if (err) console.log(err);
        });
  }
});
