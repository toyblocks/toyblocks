'use strict';

var AdminObjectsController = require('../admin/Objects');

module.exports = function () {

};
module.exports.prototype = AdminObjectsController.prototype.extend({
  area: 'moderation',
  name: 'games',
  rightLevel: 100,

  missingAction: function() {
    var _this = this;
    _this.view.render({
      title: 'Fehlstellenspiel hinzufügen'
    });
  },

  sortingAction: function() {
    var _this = this;

    _this.mongodb
    .collection('attributes')
    .find({name: 'era' })
    .toArray(function (err, data) {
      console.log(data[0].values)
      _this.view.render({
        title: 'Fehlstellenspiel hinzufügen',
        eras: data[0].values
      });
    })
  },

  addsortingAction: function() {
    this.upsertObjectAction('/moderation/games/sorting?successful=true');
  }
});
