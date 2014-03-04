'use strict';

var GamesController = require('../Games'),
  Statistics = require('../moderation/Stats');
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
    var _this = this,
      gameid  = _this.request.param('id'),
      level   = _this.request.param('level');

    if(typeof gameid !== 'undefined'){
      _this.mongodb
      .collection('multiplechoice_games')
      .find({_id: _this.mongo.ObjectID(gameid)})
      .nextObject(function(err, game) {
        _this.view.render({
          title: 'Multiplechoice',
          level: level,
          game: game
        });
      });
    }else{
      _this.mongodb
      .collection('multiplechoice_games')
      .find()
      .toArray(function(err, game) {
        game=game[Math.floor(Math.random()*game.length)];
        _this.view.render({
          title: 'Multiplechoice',
          level: level,
          game: game
        });
      });
    }
  },

  questionAction: function() {

    var _this = this,
      level = _this.request.param('level'),
      id = _this.request.param('id');


    if(typeof id === 'undefined'){
      _this.view.render({
        error: 'No ID specified'
      });
      return;
    }

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
    var slice;
    switch(level){
      case 3: slice = 10; break;
      case 2: slice = 6; break;
      default: slice = 4; break;
    }

    _this.mongodb
    .collection('multiplechoice_questions')
    .find({_id: _this.mongo.ObjectID(id)})
    .nextObject(function(err, question) {

      var answers = question.multiplechoice_answer_right
      .concat(shuffle(question.multiplechoice_answer_wrong).slice(0,slice)),
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
      result  = _this.request.param('result'),
      id      = _this.request.param('id'),
      level   = _this.request.param('level'),
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

    // TODO: check from serverside if solution is correct
    _this.mongodb
    .collection('multiplechoice_games')
    .find({_id: _this.mongo.ObjectID(id)})
    .nextObject(function(err, game) {

      // TODO: Filter questions from given ids
      // TODO: Give ids from clientside
      // TODO: we dont really need games collection, do we?
      _this.mongodb
      .collection('multiplechoice_questions')
      .find({_id: {$in: game.multiplechoice_question_reference}})
      .toArray(function(err, questions) {

        result = result.split(',');
        for (var i = 0; i < questions.length; i++) {
          var answers = questions[i].multiplechoice_answer_right,
            isCorrect = false;
          for (var j = 0; j < answers.length; j++) {
            if(String(result[i]) === String(hashString(answers[j]))){
               isCorrect = true;
            }
          }
          solution.push(isCorrect);
          questions[i].selectedAnswer = isCorrect;
          if(isCorrect){
              countCorrect++;
          }else{
              countWrong++;
          }
        }
        var percentage = {
          'wrong': (countWrong   * 100) / result.length,
          'right': (countCorrect * 100) / result.length
        };


        // Update Stats
        var userId  = _this.request.session.user.tuid;
        Statistics.prototype.insertStats(_this, 'multiplechoice', game._id, level, userId, 0, solution);

        console.log(questions);
        _this.view.render({
          result: solution,
          question: questions,
          percent: percentage
        });
      
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
