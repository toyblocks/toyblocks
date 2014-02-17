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
    console.log('resultAction');
    var _this = this,
    result = _this.request.param('result'),
    id = _this.request.param('id'),
    solution = [];


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
    // .find({_id: _this.mongo.ObjectID(id)})
    // .nextObject(function(err, game) {


      // var answers = question.multiplechoice_answer_right
      // .concat(question.multiplechoice_answer_wrong),
      // correctAnswers = question.multiplechoice_answer_right;
      var a = result.split('-');
      for (var i = 0; i < 3; i ++) {
        if(a[i] === 'true'){
        //if(result[i] === hashString(correctAnswers[i]) ){
          solution.push('Richtig');
        }else{
          solution.push('Falsch');
        }
      }

      console.log(solution);
      _this.view.render({
        result: solution
      });
    });
  },

//   checkSolutionAction: function(){
//     var _this = this,
//     answer = _this.request.param('answer'),
//     gameid = _this.request.param('gameid');

//     function hashString( str ){
//       var hash = 0, i, l, char;
//       if (str.length === 0) return hash;
//       for (i = 0, l = str.length; i < l; i++) {
//         char  = str.charCodeAt(i);
//         hash  = ((hash<<5)-hash)+char;
//       hash |= 0; // Convert to 32bit integer
//     }
//     return hash;
//   }

//   _this.mongodb
//   .collection('multiplechoice_questions')
//   .find({_id: _this.mongo.ObjectID(gameid)})
//   .toArray(function(err, question) {
//     var correctAnswers = question.multiplechoice_answer_right,
//     answerIsCorrect = false;
//     for (var i = 0; i < correctAnswers.length; i++) {
//       if(answer === hashString(correctAnswers[i])){
//         answerIsCorrect = true;
//       }
//     }
//     // TODO: add next question
//     _this.response.json({
//       correct: answerIsCorrect,
//       nextQuestion: question
//     });
//   });
// },

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
