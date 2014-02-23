'use strict';

var GamesController = require('../Games');

module.exports = function () {

};

module.exports.prototype = GamesController.prototype.extend({
  name: 'multiplechoice',
  /**
   * This Method is used for the index page
   * @return title - the title of the game
   * @return sortGames - an array of Games
   */
  indexAction: function() {
    var _this = this;
    this.mongodb
    .collection('multiplechoice_games')
    .find()
    .toArray(function(err, multiplechoiceGame){
      _this.view.render({
        title: 'Multiplechoice Spiele',
        multiplechoiceGames: multiplechoiceGame
      });
    });
  },

  /**
   * This renders the main game
   *
   * @return game - information about the game, like title
   * @return buildings - an array of buildings to display for the template
   */
  gameAction: function() {
    var _this = this;

    _this.mongodb
    .collection('multiplechoice_games')
    .find({_id: _this.mongo.ObjectID(_this.request.param('id'))})
    .nextObject(function(err, game) {
      _this.view.render({
        title: 'Multiplechoice',
        game: game
      });
    });
  },

  questionAction: function() {

    var _this = this;

    //+ Jonas Raoni Soares Silva
    //@ http://jsfromhell.com/array/shuffle [v1.0]
    function shuffle(o){ //v1.0
      for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i),
       x = o[--i], o[i] = o[j], o[j] = x);
      return o;
    }

    function hashString( str ){
      var hash = 0, i, l, char;
      if (str.length === 0) return hash;
      for (i = 0, l = str.length; i < l; i++) {
        char  = str.charCodeAt(i);
        hash  = ((hash<<5)-hash)+char;
        hash |= 0; // Convert to 32bit integer
      }
      return hash;
    }

    _this.mongodb
    .collection('multiplechoice_questions')
    .find({_id: _this.mongo.ObjectID(_this.request.param('id'))})
    .nextObject(function(err, question) {

      var answers = question.multiplechoice_answer_right
      .concat(shuffle(question.multiplechoice_answer_wrong).slice(0,3)),
       correctAnswers = question.multiplechoice_answer_right;

      answers = shuffle(answers);
      for (var i in correctAnswers) {
        correctAnswers[i] = hashString(correctAnswers[i]);
      }

      _this.view.render({
        question: question,
        answers: answers,
        right_answers: correctAnswers
      });
    });
  },

  resultAction: function(){
    var _this = this,
    result = _this.request.param('result'),
    id = _this.request.param('id'),
    solution = [],
    countCorrect = 0,
    countWrong = 0;


    function hashString( str ){
      var hash = 0, i, l, char;
      if (str.length === 0) return hash;
      for (i = 0, l = str.length; i < l; i++) {
        char  = str.charCodeAt(i);
        hash  = ((hash<<5)-hash)+char;
        hash |= 0; // Convert to 32bit integer
      }
      return hash;
    }

    //TODO: check from serverside if solution is correct
    _this.mongodb
    .collection('multiplechoice_games')
    .find({_id: _this.mongo.ObjectID(id)})
    .nextObject(function(err, game) {

      // _this.mongodb
      // .collection('multiplechoice_questions')
      // .find({_id: game._id})
      // .nextObject(function(err, q) {
      // });


      // var answers = question.multiplechoice_answer_right
      // .concat(question.multiplechoice_answer_wrong),
      // correctAnswers = question.multiplechoice_answer_right;
      var a = result.split('-');
      for (var i = 0; i < a.length; i ++) {
        if(a[i] === 'true'){
        //if(result[i] === hashString(correctAnswers[i]) ){
          solution.push('Richtig');
          countCorrect++;
        }else{
          solution.push('Falsch');
          countWrong++;
        }
      }
      var percantage = {
        'wrong':1/a.length*countWrong*100,
        'right':1/a.length*countCorrect*100
      };

      _this.view.render({
        result: solution,
        question: game.multiplechoice_question_reference,
        percent: percantage
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
    .find({_id: {$in: game.multiplechoice_question_reference},
      _random: {$near: [Math.random(), 0]}})
    .toArray(renderCallback);
  }

});
