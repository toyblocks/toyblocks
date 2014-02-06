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

    _this.mongodb
      .collection('multiplechoice_games')
      .find({_id: _this.mongo.ObjectID(_this.request.param('id'))})
      .nextObject(function(err, game) {
        _this.view.render({
          title: "Multiplechoice",
          game: game
        });
      });
  },

  questionAction: function() {
    var _this = this;

    //+ Jonas Raoni Soares Silva
    //@ http://jsfromhell.com/array/shuffle [v1.0]
    function shuffle(o){ //v1.0
      for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
      return o;
    };

    function hashString( str ){
      var hash = 0, i, l, char;
      if (str.length == 0) return hash;
      for (i = 0, l = str.length; i < l; i++) {
          char  = str.charCodeAt(i);
          hash  = ((hash<<5)-hash)+char;
          hash |= 0; // Convert to 32bit integer
      }
      return hash;
    };

    _this.mongodb
      .collection('multiplechoice_questions')
      .find({_id: _this.mongo.ObjectID(_this.request.param('id'))})
      .nextObject(function(err, question) {
        console.log(question);
        var answers = question.multiplechoice_answer_right.concat(question.multiplechoice_answer_wrong),
          right_answers = question.multiplechoice_answer_right;
        answers = shuffle(answers);

        for (var i in right_answers) {
          right_answers[i] = hashString(right_answers[i]);
        }

        _this.view.render({
          question: question,
          answers: answers,
          right_answers: right_answers
        });
      });
  },

// Gets the questions from the database and returns it with a callback
//
// @param game           - information about the current game
// @param renderCallback - the callback to call after we got the questions
  renderGame: function(game, renderCallback) {
    var _this = this,
      references;
    //get all question for this game
    for (ref in game.multiplechoice_question_reference) {

    }

    _this.mongodb
      .collection('multiplechoice_questions')
      .find({_id: {$in: game.multiplechoice_question_reference}, _random: {$near: [Math.random(), 0]}})
      .toArray(renderCallback);
  },

});
