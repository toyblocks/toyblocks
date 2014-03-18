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
      level   = parseInt(_this.request.param('level'),10) || 1;

    _this.increaseStat('count_played');
    
    if(typeof ids === 'undefined'){
      var count;
      //give specific game according to ids
      switch(level){
        case 2: count = 6; break;
        case 3: count = 10; break;
        default: count = 3; break;
      }
      _this.mongodb
      .collection('multiplechoice_questions')
      .find()
      .toArray(function(err, questions) {
        questions = _this.shuffleArray(questions).slice(0, count);
        _this.view.render({
          title: 'Multiple Choice',
          level: level,
          questions: questions
        });
      });
    }else{
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

    _this.mongodb
    .collection('multiplechoice_questions')
    .find({_id: _this.mongo.ObjectID(id)})
    .nextObject(function(err, question) {

      var answers = _this.shuffleArray(question
          .multiplechoice_answer_right
          .concat( _this.shuffleArray(question.multiplechoice_answer_wrong)
                  .slice(0,3)));

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

    if(typeof ids === 'undefined' || typeof result === 'undefined' ){
      _this.view.render({error: 'Error!'});
      return;
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
          if(String(result[i]) === String(_this.hashString(answers[j]))){
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

      _this.view.render({
        result: solution,
        question: questions,
        percent: percentage
      });
    });
  }
});
