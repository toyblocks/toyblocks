'use strict';

var AdminObjectsController = require('../admin/Objects'),
  AttributesController = require('../admin/Attributes'),
  daily = require('../games/Daily.js');

module.exports = function () {

};
module.exports.prototype = AdminObjectsController.prototype.extend({
  area: 'moderation',
  name: 'games',
  rightLevel: 100,

  missingAction: function () {
    var _this = this;
    if (this.request.query.successful) {
      this.addMessage('success', 'Erfolgreich hinzugefügt');
    }
    _this.view.render({
      title: 'Fehlstellenspiel hinzufügen - ToyBlocks'
    });
  },

  addMissingAction: function () {
    this.upsertObjectAction('/moderation/games/missing?successful=true');
  },

  multiplechoiceAction: function () {
    var _this = this;
    _this.view.render({
      title: 'Multiplechoice-Frage hinzufügen - ToyBlocks'
    });
  },

  addmultiplechoiceAction: function () {
    this.upsertObjectAction('/moderation/games/multiplechoice?successful=true');
  },

  assembleAction: function () {
    var _this = this;
    if (this.request.query.successful) {
      this.addMessage('success', 'Erfolgreich hinzugefügt');
    }
    _this.view.render({
      title: 'Zusammensetzspiel hinzufügen - ToyBlocks'
    });
  },

  addAssembleAction: function () {
    this.upsertObjectAction('/moderation/games/assemble?successful=true');
  },

  saveEnumsAction: function () {
    AttributesController.prototype.saveEnumsAction(this);
  },

  sortingAction: function () {
    var _this = this;

    _this.mongodb
      .collection('attributes')
      .find({ name: 'era' })
      .toArray(function (_err, data) {
        _this.view.render({
          title: 'Fehlstellenspiel hinzufügen - ToyBlocks',
          eras: data[0].values
        });
      });
  },

  dailyAction: function () {
    _this.mongodb
      .collection('daily_games')
      .find()
      .toArray(function (_err, data) {
        _this.view.render({
          title: 'Daily Challenge - ToyBlocks',
          games: data
        });
      });

  },

  newdailyAction: function () {
    var _this = this;
    daily.generateDailyGame(_this.mongodb);
  },

  addsortingAction: function () {
    this.upsertObjectAction('/moderation/games/sorting?successful=true');
  }
});
