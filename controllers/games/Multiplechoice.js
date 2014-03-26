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

    if(typeof ids === 'undefined'){

      //give random game
      var count;
      switch(level){
        case 2: count = 6; break;
        case 3: count = 10; break;
        default: count = 3; break;
      }
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

      _this.mongodb
        .collection('multiplechoice_questions')
        .find({_id: {$in: ids}})
        .toArray(function(err, questions) {
          _this.view.render({
            title: 'Multiple Choice',
            level: level,
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

      var answersRight = _this.shuffleArray(question.multiplechoice_answer_right)[0];
      var answersWrong = _this.shuffleArray(question.multiplechoice_answer_wrong).slice(0,3);
      var answers = _this.shuffleArray(answersWrong.concat(answersRight));

      _this.view.render({
        question: question,
        answers: answers
      });
    });
  },

  resultAction: function(){
    console.log("enter");
    var _this = this,
      result  = _this.request.param('result'),
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
              if(String(selected[j][1]) === String(_this.hashString(answers[k]))){
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

      _this.view.render({
        result: solution,
        question: questions,
        percent: percentage
      });
    });
  }
});
