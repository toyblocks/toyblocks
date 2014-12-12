'use strict';

var GamesController = require('../Games'),
  Statistics = require('../admin/Stats');

module.exports = function () {

};

module.exports.prototype = GamesController.prototype.extend({
  name: 'multiplechoice',

  /**
   * This Method is used for the index page
   */
  indexAction: function() {
    var _this = this;
    _this.getDbTexts(
      ['game_multiplechoice_explain'],
      function(texts) {
        texts.title = 'Multiple Choice';
        _this.view.render(texts);
      });
  },

  /**
   * This renders the main game
   */
  gameAction: function() {
    var _this = this,
      ids  = _this.request.param('id'),
      level   = parseInt(_this.request.param('level'),10) || 1,
      isDaily = parseInt(_this.request.param('isDaily'),10) || 0;

    if(typeof ids === 'undefined'){

      //give random game
      var count;
      switch(level){
        case 2:
          count = 6;
          break;
        case 3:
          count = 10;
          break;
        default:
          count = 3;
          break;
      }
      // TODO: Set count always to 10
      
      _this.increaseStat('q'+count+'_count_played');

      _this.mongodb
      .collection('multiplechoice_questions')
      .find()
      .toArray( function(err, questions) {
        questions = _this.shuffleArray(questions).slice(0, count);
        _this.view.render({
          title: 'Multiple Choice',
          level: level,
          questions: questions
        });
      });
    }else{

      //give specific game according to ids
      ids = ids.split(',');
      for (var i = 0; i < ids.length; i++) {
        ids[i] = _this.mongo.ObjectID(ids[i]);
      }
      if(isDaily){
        _this.view.setOnlyContent(true);
      }

      _this.mongodb
      .collection('multiplechoice_questions')
      .find({_id: {$in: ids}})
      .toArray(function(err, questions) {
        _this.view.render({
          title: 'Multiple Choice',
          level: level,
          isDaily: isDaily,
          questions: questions
        });
      });
    }
  },

  containerAction: function() {
    var _this = this,
      id = _this.request.param('id');

    if(typeof id === 'undefined'){
      _this.view.render({ error: 'No ID specified' });
      return;
    }

    _this.mongodb
    .collection('multiplechoice_questions')
    .find({_id: _this.mongo.ObjectID(id)})
    .nextObject(function (err, question) {

      var right = question.multiplechoice_answer_right;
      var wrong = question.multiplechoice_answer_wrong;
      var answersRight = _this.shuffleArray(right)[0];
      var answersWrong = _this.shuffleArray(wrong).slice(0,3);
      var answers = _this.shuffleArray(answersWrong.concat(answersRight));

      _this.view.render({
        question: question,
        answers: answers
      });
    });
  },

  resultAction: function(){
    var _this = this,
      result  = _this.request.param('result'),
      isDaily  = _this.request.param('daily') || false,
      solution = [],
      countCorrect = 0,
      countWrong = 0,
      objectIds = [],
      selected = [];

    if(typeof result === 'undefined' ){
      _this.view.render({error: 'Error!'});
      return;
    }

    // result contains the question ids and the hashed string
    result = result.split(',');

    for (var i = 0; i < (result.length/2); i++) {
      selected[i] = [result[i*2], result[(i*2)+1]];
      objectIds[i] = _this.mongo.ObjectID(result[i*2]);
    }

    _this.mongodb
    .collection('multiplechoice_questions')
    .find({_id: {$in: objectIds}})
    .toArray(function(err, questions) {

      // check for every question if the solution is corrrect
      for (var i = 0; i < questions.length; i++) {
        var answers = questions[i].multiplechoice_answer_right,
          isCorrect = false;
        for (var j = 0; j < selected.length; j++) {
          if(String(questions[i]._id) === String(selected[j][0])){
            for (var k = 0; k < answers.length; k++) {
              if(String(selected[j][1]) ===
                 String(_this.hashString(answers[k]))){
                isCorrect = true;
              }
            }
            break;
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
        'wrong': (countWrong   * 100) / (countWrong + countCorrect),
        'right': (countCorrect * 100) / (countWrong + countCorrect)
      };

      // Update Stats
      Statistics.prototype.insertStats(_this, 'multiplechoice');

      if(isDaily){
        _this.response.json({
          result: solution
        });
      }else{
        _this.view.render({
          result: solution,
          question: questions,
          percent: percentage
        });
      }
    });
  }
});
