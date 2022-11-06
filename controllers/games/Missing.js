'use strict';

var GamesController = require('../Games'),
  Statistics = require('../admin/Stats');
module.exports = function () { };

module.exports.prototype = GamesController.prototype.extend({
  name: 'missing',

  /**
  *  indexAction() answers GET requests
  *  for the overview of missingpart games
  *
  * @return <String> title Title of indexpage
  * @return <Array> data
  */
  indexAction: function () {
    var _this = this;
    _this.getDbTexts(
      ['game_missing_explain',
        'game_missing_level1',
        'game_missing_level2'],
      function (texts) {
        texts.title = 'Fehlstellen - ToyBlocks';
        _this.view.render(texts);
      });
  },

  /**
  *  answers GET requests for main page
  *  for actual missingparts game
  *
  * @return <String> title
  * @return <Array> game
  * @return <String> mainimage
  * @return <Array> images
  */
  gameAction: function () {
    var _this = this;
    var ids = _this.request.query.id;
    var level = parseInt(_this.request.query.level, 10) || 1;
    var isDaily = parseInt(_this.request.query.isDaily, 10) || 0;
    var count = parseInt(_this.request.query.count, 10) || 5;

    _this.increaseStat('level' + level + '_count_played');
    if (typeof ids === 'undefined') {
      //give random games

      _this.renderGame(level, function (_err, games) {
        games = _this.shuffleArray(games).slice(0, count);
        _this.view.render({
          title: 'Fehlstellen - ToyBlocks',
          games: games,
          level: level
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
        .collection('missingparts_games')
        .find({ _id: { $in: ids } })
        .toArray(function (_err, game) {
          _this.view.render({
            title: 'Fehlstellen - ToyBlocks',
            games: game,
            isDaily: isDaily,
            level: level
          });
        });
    }
  },

  /** 
   * Fetches related entries from the database and returns it with a callback
   * 
   * @param Level          - level of game
   * @param renderCallback - the callback to call after we got the buildings
   */
  renderGame: function (level, renderCallback) {
    if (level === 3) {
      // Only level 2 buildings
      this.mongodb
        .collection('missingparts_games')
        .find({ level: 2, active: true })
        .toArray(renderCallback);
    } else {

      // Level 1 and 2
      this.mongodb
        .collection('missingparts_games')
        .find({ level: 1, active: true })
        .toArray(renderCallback);
    }
  },

  /**
  * fetches container solutions from mongodb for given game id
  *
  * @param <String> id
  * @param <String> level
  * @return <Array> images for the Container
  */
  containerAction: function () {
    var _this = this;
    var id = _this.request.query.id;
    var level = _this.request.query.level || 1;

    if (typeof id === 'undefined' || id === 'undefined') {
      _this.view.render({ error: 'No ID specified' });
      return;
    }

    _this.mongodb
      .collection('missingparts_games')
      .find({ _id: _this.mongo.ObjectID(id) })
      .next(function (_err, game) {

        //get one random right solution
        var solution = game.missingparts_correctimage[
          Math.floor(game.missingparts_correctimage.length * Math.random())];

        // Get the wrong solutions
        _this.mongodb
          .collection('missingparts_images')
          .find({
            missingparts_category: game.missingparts_category,
            _id: { $nin: game.missingparts_correctimage }
          }) // no 2 solutions
          .toArray(function (_err, images) {

            // Get the right solution
            _this.mongodb
              .collection('missingparts_images')
              .find({ _id: _this.mongo.ObjectID(solution.toString()) })
              .next(function (_err2, solutionimage) {

                // mix the solutions together
                images = _this.shuffleArray(images).slice(0, 3);
                images.push(solutionimage);
                images = _this.shuffleArray(images);

                _this.view.render({
                  game: game,
                  images: images,
                  level: level
                });
              });
          });
      });
  },

  /**
  * resultAction() checks if game selection is correct
  *
  * @param <Number> result
  * @param <String> gameid
  * @return <Array> correct
  * @return <Number> correctBuilding
  */
  resultAction: function () {
    var _this = this;
    var result = _this.request.query.result;
    var isDaily = _this.request.query.daily || false;
    var solution = [];
    var selected = [];
    var countCorrect = 0;
    var countWrong = 0;
    var objectIds = [];

    if (typeof result === 'undefined') {
      _this.view.render({ error: 'Error' });
      return;
    }

    // extract the games and selected ids
    result = result.split(',');
    for (var i = 0; i < (result.length / 2); i++) {
      selected[i] = [result[i * 2], result[(i * 2) + 1]];
      objectIds[i] = _this.mongo.ObjectID(result[i * 2]);
    }

    // get the game paramenters first
    _this.mongodb
      .collection('missingparts_games')
      .find({ _id: { $in: objectIds } })
      .toArray(function (_err, game) {

        // lets see if the correct answer was selected
        // because the order is random we need to iterate all the things
        for (var i = 0; i < game.length; i++) {
          var answers = game[i].missingparts_correctimage,
            isCorrect = false;

          for (var j = 0; j < selected.length; j++) {
            if (String(selected[j][0]) === String(game[i]._id)) {
              for (var k = 0; k < answers.length; k++) {
                if (String(selected[j][1]) === String(answers[k])) {
                  isCorrect = true;
                  break;
                }
              }
              break;
            }
          }
          solution.push(isCorrect);

          game[i].selectedAnswer = isCorrect;
          if (isCorrect) {
            countCorrect++;
          } else {
            countWrong++;
          }
        }
        var percentage = {
          'wrong': (countWrong * 100) / (countWrong + countCorrect),
          'right': (countCorrect * 100) / (countWrong + countCorrect)
        };

        // Update Stats
        Statistics.prototype.insertStats(_this, 'missing');

        // Update daily
        if (isDaily) {
          _this.response.json({
            result: solution
          });
        } else {
          // send the solution back to client
          _this.view.render({
            solution: solution,
            game: game,
            percent: percentage
          });
        }
      });
  },


  /**
  * I don't know how to load every picture from the db asynchronos
  * So the client sends some requests about the id for the picture
  * This feels wrong but works fine right now
  */
  getsolutionpictureAction: function () {
    var _this = this;
    let id = _this.request.query.id;
    _this.mongodb
      .collection('missingparts_images')
      .find({ _id: _this.mongo.ObjectID(id) })
      .next(function (_err, ele) {
        _this.response.json({
          imgid: ele.image,
          imgtitle: ele.title,
        });
      });
  }
});
