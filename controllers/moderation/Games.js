'use strict';

var BaseController = require('../Moderation');

module.exports = function () {

};
module.exports.prototype = BaseController.prototype.extend({
  name: 'games',

  missingAction: function() {
    var _this = this;
    _this.view.render({
      title: 'Fehlstellenspiel hinzufügen'
    });
  },

  sortingAction: function() {
    var _this = this;

    _this.mongodb
    .collection('statistics')
    .find({gametype: 'sorting' })
    .toArray(function (err, ele) {
      var count = ele.length;
      _this.view.render({
        title: 'Fehlstellenspiel hinzufügen',
        count: count
      });
    })
  }
});
