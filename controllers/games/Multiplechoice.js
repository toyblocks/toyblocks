'use strict';

var GamesController = require('../Games'),
  Statistics = require('../admin/Stats');

module.exports = function () {

};

module.exports.prototype = GamesController.prototype.extend({
  name: 'multiplechoice',
  rightLevel: 300,

  /**
   * This Method is used for the index page
   */
  indexAction: function () {
    var _this = this;
    _this.getDbTexts(
      ['game_multiplechoice_explain',
        'game_multiplechoice_level1',
        'game_multiplechoice_level2'],
      function (texts) {
        texts.title = 'Multiple Choice - ToyBlocks';
        _this.view.render(texts);
      });
  },

  /**
   * This renders the main game
   */
  gameAction: function () {
    var _this = this;
    var ids = _this.request.query.id;
    var level = parseInt(_this.request.query.level, 10) || 1;
    var isDaily = parseInt(_this.request.query.isDaily, 10) || 0;

    if (typeof ids === 'undefined') {

      //give random game
      var count = 10;

      _this.increaseStat('level' + level + '_count_played');

      _this.renderGame(level, function (_err, questions) {
        questions = _this.shuffleArray(questions).slice(0, count);
        _this.view.render({
          title: 'Multiple Choice - ToyBlocks',
          level: level,
          questions: questions
        });
      });
    } else {

      //give specific game according to ids
      ids = ids.split(',');
      for (var i = 0; i < ids.length; i++) {
        ids[i] = _this.mongo.ObjectID(ids[i]);
      }
      if (isDaily) {
        _this.view.setOnlyContent(true);
      }

      _this.mongodb
        .collection('multiplechoice_questions')
        .find({ _id: { $in: ids } })
        .toArray(function (_err, questions) {
          _this.view.render({
            title: 'Multiple Choice - ToyBlocks',
            level: level,
            isDaily: isDaily,
            questions: questions
          });
        });
    }
  },

  /** 
 * Fetches related entries from the database and returns it with a callback
 * 
 * @param Level          - level of game
 * @param renderCallback - the callback to call after we got the questions
 */
  renderGame: function (level, renderCallback) {
    var query;

    if (level === 3) {
      query = { level: 2, active: true };
    } else if (level === 2) {
      query = { active: true };
    } else {
      query = { level: 1, active: true };
    }

    this.mongodb
      .collection('multiplechoice_questions')
      .find(query)
      .toArray(renderCallback);
  },

  containerAction: function () {
    var _this = this,
      id = _this.request.query.id;

    if (typeof id === 'undefined') {
      _this.view.render({ error: 'No ID specified' });
      return;
    }

    _this.mongodb
      .collection('multiplechoice_questions')
      .find({ _id: _this.mongo.ObjectID(id) })
      .next(function (_err, question) {

        var right = question.multiplechoice_answer_right;
        var wrong = question.multiplechoice_answer_wrong;
        var answersRight = _this.shuffleArray(right)[0];
        var answersWrong = _this.shuffleArray(wrong).slice(0, 3);
        var answers = _this.shuffleArray(answersWrong.concat(answersRight));

        _this.view.render({
          question: question,
          answers: answers
        });
      });
  },

  resultAction: function () {
    var _this = this;
    var result = _this.request.query.result;
    var isDaily = _this.request.query.daily || false;
    var solution = [];
    var countCorrect = 0;
    var countWrong = 0;
    var objectIds = [];
    var selected = [];

    if (typeof result === 'undefined') {
      _this.view.render({ error: 'Error!' });
      return;
    }

    // result contains the question ids and the hashed string
    result = result.split(',');

    for (var i = 0; i < (result.length / 2); i++) {
      selected[i] = [result[i * 2], result[(i * 2) + 1]];
      objectIds[i] = _this.mongo.ObjectID(result[i * 2]);
    }

    _this.mongodb
      .collection('multiplechoice_questions')
      .find({ _id: { $in: objectIds } })
      .toArray(function (_err, questions) {

        // check for every question if the solution is corrrect
        for (let i = 0; i < questions.length; i++) {
          let answers = questions[i].multiplechoice_answer_right,
            isCorrect = false;
          for (let j = 0; j < selected.length; j++) {
            if (String(questions[i]._id) === String(selected[j][0])) {
              for (let k = 0; k < answers.length; k++) {
                if (String(selected[j][1]) ===
                  String(_this.hashString(answers[k]))) {
                  isCorrect = true;
                }
              }
              break;
            }
          }
          solution.push(isCorrect);
          questions[i].selectedAnswer = isCorrect;
          if (isCorrect) {
            countCorrect++;
          } else {
            countWrong++;
          }
        }

        let percentage = {
          'wrong': (countWrong * 100) / (countWrong + countCorrect),
          'right': (countCorrect * 100) / (countWrong + countCorrect)
        };

        // sort
        let counter = 0;
        let sortedResult = [];
        for (let i = 0; i < questions.length; i++) {
          for (let j = 0; j < questions.length; j++) {
            if (String(result[counter]) === String(questions[j]._id)) {
              sortedResult[i] = questions[j];
              break;
            }
          }
          counter += 2;
        }

        // Update Stats
        Statistics.prototype.insertStats(_this, 'multiplechoice');

        if (isDaily) {
          _this.response.json({
            result: solution
          });
        } else {
          _this.view.render({
            result: solution,
            question: sortedResult,
            percent: percentage
          });
        }
      });
  }
});
