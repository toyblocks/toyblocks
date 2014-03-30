'use strict';

var GamesController = require('../Games'),
  Statistics = require('../admin/Stats');
module.exports = function () {};

module.exports.prototype = GamesController.prototype.extend({
  name: 'missing',

  /**
  *  indexAction() answers GET requests
  *  for the overview of missingpart games
  *
  * @return <String> title Title of indexpage
  * @return <Array> data
  */
  indexAction: function() {
    var _this = this;
    _this.getDbTexts(
      ['game_missing_explain'],
      function(texts) {
        texts.title = 'Fehlstellen';
        _this.view.render(texts);
      });
  },

  /**
  *  gameAction() answers GET requests
  *  for actual missingparts game
  *
  * @return <String> title
  * @return <Array> game
  * @return <String> mainimage
  * @return <Array> images
  */
  gameAction: function() {
    var _this = this,
      ids = _this.request.param('id'),
      level = parseInt(_this.request.param('level'), 10) || 1,
      isDaily = parseInt(_this.request.param('isDaily'),10) || 0;



    _this.increaseStat('level' + level + '_count_played');

    if(typeof ids === "undefined"){

      //give random game
      var count;
      switch(level){
        case 2: count = 6; break;
        case 3: count = 10; break;
        default: count = 3; break;
      }

      _this.mongodb
      .collection('missingparts_games')
      .find()
      .toArray( function(err, games) {
        games = _this.shuffleArray(games).slice(0, count);
        _this.view.render({
          title: 'Fehlstellen',
          games: games,
          level: level
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
        .collection('missingparts_games')
        .find({_id: {$in: ids}})
        .toArray(function(err, game) {
          _this.view.render({
            title: 'Fehlstellen',
            games: game,
            isDaily: isDaily,
            level: level
          });
      });
    }
  },

  /**
  *  renderGame() fetches images from mongodb
  *
  * @param <Array> game
  * @param <Callback> renderCallback
  * @return <Array> images in Callback
  */
  containerAction: function() {
    var _this = this,
      id = _this.request.param('id');

    if(typeof id === 'undefined'){
      _this.view.render({ error: 'No ID specified' });
      return;
    }
    
    _this.mongodb
    .collection('missingparts_games')
    .find({_id: _this.mongo.ObjectID(id)})
    .nextObject(function (err, game) {
      //get one random solution
      var solution = game.missingparts_correctimage[
          Math.floor(game.missingparts_correctimage.length * Math.random())];

      _this.mongodb
        .collection('missingparts_images')
        .find({ missingparts_category: game.missingparts_category,
                _id: {$nin: game.missingparts_correctimage}}) // no 2 solutions
        .toArray(function (err, images) {
          
          _this.mongodb
          .collection('missingparts_images')
          .find({_id: _this.mongo.ObjectID(solution.toString())})
          .nextObject(function (err2, images2) {
            images = _this.shuffleArray(images.slice(0,3))
            images.push(images2);
            images = _this.shuffleArray(images);

            _this.view.render({
              game: game,
              images: images
            });
          });
        });
    });
  },

  /**
  * checkSelectedAction() checks if game selection is correct
  *
  * @param <Number> result
  * @param <String> gameid
  * @return <Boolean> correct
  * @return <Number> correctBuilding
  */
  resultAction: function() {
    var _this = this,
      result  = _this.request.param('result'),
      isDaily  = _this.request.param('daily') || false,
      solution = [],
      selected = [],
      countCorrect = 0,
      countWrong = 0,
      objectIds = [];
    console.log("enter");
    if(typeof result === 'undefined'){
      _this.view.render({error:'Error'});
      return;
    }

    result = result.split(',');
    for (var i = 0; i < (result.length/2); i++) {
      selected[i] = [result[i*2], result[(i*2)+1]];
      objectIds[i] = _this.mongo.ObjectID(result[i*2]);
    }

    // get the game paramenters first
    _this.mongodb
    .collection('missingparts_games')
    .find( {_id: {$in: objectIds}} )
    .toArray(function(err, game) {

      // lets see if the correct image is clicked
      // because the order is random we need to iterate all the things
      for (var i = 0; i < game.length; i++) {
        var answers = game[i].missingparts_correctimage,
          isCorrect = false;
        for (var j = 0; j < selected.length; j++) {
          if(String(selected[j][0]) === String(game[i]._id)){
            for (var k = 0; k < answers.length; k++) {
              
              if(String(selected[j][1]) === String(answers[k])){
                isCorrect = true;
                break;
              }
            }
            break;
          }
        }
        solution.push(isCorrect);

        game[i].selectedAnswer = isCorrect;
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
      Statistics.prototype.insertStats(_this, 'missing');

      console.log("missing: ", isDaily, solution);
      if(isDaily){
        _this.response.json({
          result: solution
        });
      }else{
        // send the solution back to client
        _this.view.render( {
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
  getsolutionpictureAction : function () {
    var _this = this;
    _this.mongodb
    .collection('missingparts_images')
    .find({_id: _this.mongo.ObjectID(_this.request.param('id'))})
    .nextObject(function (err, ele) {
      _this.response.json({imgid: ele.image});
    });
  }
});
