'use strict';

var AdminObjectsController = require('../admin/Objects'),
  AttributesController = require('../admin/Attributes');

module.exports = function () {

};
module.exports.prototype = AdminObjectsController.prototype.extend({
  area: 'moderation',
  name: 'games',
  rightLevel: 100,

  missingAction: function() {
    var _this = this;
    if (this.request.param('successful')) {
      this.addMessage('success', 'Erfolgreich hinzugefügt');
    }
    _this.view.render({
      title: 'Fehlstellenspiel hinzufügen'
    });
  },

  addMissingAction: function() {
    this.upsertObjectAction('/moderation/games/missing?successful=true');
  },

  multiplechoiceAction: function() {
    var _this = this;
    _this.view.render({
      title: 'Multiplechoice-Frage hinzufügen'
    });
  },

  addmultiplechoiceAction: function() {
    this.upsertObjectAction('/moderation/games/multiplechoice?successful=true');
  },

  assembleAction: function() {
    var _this = this;
    if (this.request.param('successful')) {
      this.addMessage('success', 'Erfolgreich hinzugefügt');
    }
    _this.view.render({
      title: 'Zusammensetzspiel hinzufügen'
    });
  },

  addAssembleAction: function() {
    this.upsertObjectAction('/moderation/games/assemble?successful=true');
  },

  saveEnumsAction: function() {
    AttributesController.prototype.saveEnumsAction(this);
  },

  sortingAction: function() {
    var _this = this;

    _this.mongodb
    .collection('attributes')
    .find({name: 'era' })
    .toArray(function (err, data) {
      _this.view.render({
        title: 'Fehlstellenspiel hinzufügen',
        eras: data[0].values
      });
    });
  },

  addsortingAction: function() {
    this.upsertObjectAction('/moderation/games/sorting?successful=true');
  }
});
