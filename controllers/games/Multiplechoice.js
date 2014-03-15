'use strict';

var GamesController = require('../Games'),
  Statistics = require('../admin/Stats');
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
    this.view.render({
      title: 'Multiple Choice'
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
      ids  = _this.request.param('id'),
      level   = _this.request.param('level'),
      count;

    _this.increaseStat('count_played');
    
    if(typeof gameid !== 'undefined'){

      //give random game
      ids = ids.split(',');
      _this.mongodb
        .collection('multiplechoice_questions')
        .find({_id: {$in: ids}})
        .nextObject(function(err, questions) {
          _this.view.render({
            title: 'Multiple Choice',
            level: level,
            questions: questions
          });
      });
    }else{

      //give specific game according to ids
      switch(level){
        case 3: count = 9; break;
        case 2: count = 6; break;
        default: count = 3; break;
      }
      _this.mongodb
      .collection('multiplechoice_questions')
      .find()
      .toArray(function(err, questions) {
        questions = questions.sort(function() { return 0.5 - Math.random() }).slice(0,count);
        console.log(questions);
        _this.view.render({
          title: 'Multiple Choice',
          level: level,
          questions: questions
        });
      });
    }
  },

  questionAction: function() {
    var _this = this,
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

    _this.mongodb
    .collection('multiplechoice_questions')
    .find({_id: _this.mongo.ObjectID(id)})
    .nextObject(function(err, question) {

      var answers = question.multiplechoice_answer_right
      .concat(shuffle(question.multiplechoice_answer_wrong).slice(0,3)),
       correctAnswers = question.multiplechoice_answer_right;
      answers = shuffle(answers);

      _this.view.render({
        question: question,
        answers: answers
      });
    });
  },

  resultAction: function(){
    var _this = this,
      result  = _this.request.param('result'),
      ids      = _this.request.param('ids'),
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

    if(typeof ids === 'undefined'){
      _this.view.render({
        error: 'Irgendwas lief falsch!'
      });
    }


    var objectIds = ids.split(','),
        result = result.split(',');

    for (var i = objectIds.length - 1; i >= 0; i--) {
      objectIds[i] = _this.mongo.ObjectID(objectIds[i]);
    }

    console.log(objectIds);
    _this.mongodb
    .collection('multiplechoice_questions')
    .find({_id: {$in: objectIds}})
    .toArray(function(err, questions) {

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
      Statistics.prototype.insertStats(_this, 'multiplechoice', ids, level, userId, 0, solution);

      console.log(questions);
      _this.view.render({
        result: solution,
        question: questions,
        percent: percentage
      });
    });
  }
});
