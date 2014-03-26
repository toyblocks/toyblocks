'use strict';

var BaseController = require('../Base');

module.exports = function () {
};
module.exports.prototype = BaseController.prototype.extend({
  area: 'index',
  name: 'welcome',
  rightLevel: 300,

  indexAction: function() {
    var _this = this;

    _this.getDbTexts(
      ['welcome_title', 'welcome_body',
      'game_sorting_text', 'game_challenge_text',
      'game_assemble_text', 'game_missing_text',
      'game_multiplechoice_text'],
      function(texts) {
        _this.view.render({
          headline: texts.welcome_title,
          body: texts.welcome_body,
          sorting: texts.game_sorting_text,
          challenge: texts.game_challenge_text,
          assemble: texts.game_assemble_text,
          missing: texts.game_missing_text,
          multiplechoice: texts.game_multiplechoice_text
        });
      }
    );
  },

});
