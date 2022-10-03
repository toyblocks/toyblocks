'use strict';

var GamesController = require('../Games');

module.exports = function () {

};
module.exports.prototype = GamesController.prototype.extend({
  name: 'index',

  indexAction: function () {
    var _this = this;
    _this.getDbTexts(
      ['game_sorting_text', 'game_challenge_text',
        'game_assemble_text', 'game_missing_text',
        'game_multiplechoice_text'],
      function (texts) {
        texts.title = 'Spiele Übersicht - ToyBlocks';
        _this.view.render(texts);
      });
  }
});
