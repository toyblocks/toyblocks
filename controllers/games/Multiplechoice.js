'use strict';

var GamesController = require('../Games'),
  attributeModel = require('../../models/Attribute');

module.exports = function () {

};

module.exports.prototype = GamesController.prototype.extend({
  name: 'multiplechoice',

// This Method is used for the index page, see http://127.0.0.1:3000/games/multiplechoice
// Collect the game data from the database and show it
//
// @return title - the title of the game
// @return sortGames - an array of Games
  indexAction: function() {
    var _this = this;
    this.mongodb
      .collection('multiplechoice_games')
      .find({})
      .toArray(function(err, multiplechoiceGames){
        _this.view.render({
          title: 'Multiplechoice Spiele',
          multiplechoiceGames: multiplechoiceGames
        });
      });
  },

// This renders the main game
//
// @return game - information about the game, like title
// @return buildings - an array of buildings to display for the template
  gameAction: function() {
    var _this = this;

    this.mongodb
      .collection('multiplechoice_games')
      .find({_id: this.mongo.ObjectID(this.request.param('id'))})
      .nextObject(function(err, game) {
        _this.renderGame(game, function(err, questions){
          console.log(questions);
          _this.view.render({
            title: "Multiplechoice",
            game: game,
            questions: questions
          });
        });
      });
  },

// Gets the questions from the database and returns it with a callback
//
// @param game           - information about the current game
// @param renderCallback - the callback to call after we got the questions
  renderGame: function(game, renderCallback) {
    var _this = this;
    //get all question for this game
    _this.mongodb
      .collection('multiplechoice_questions')
      .find({_id: {$in: game.multiplechoice_question_reference}, _random: {$near: [Math.random(), 0]}})
      .toArray(renderCallback);
  },

});
