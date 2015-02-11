'use strict';

var GamesController = require('../Games'),
  Statistics = require('../admin/Stats');

module.exports = function () {
};

module.exports.prototype = GamesController.prototype.extend({
  name: 'assemble',

  /**
  * This Method is used for the game index page,
  * Collect the game data from the database and show it
  */
  indexAction: function() {
    var _this = this;
    _this.getDbTexts(
      ['game_assemble_explain'],
      function(texts) {
        texts.title = 'Baukasten - ToyBlocks';
        _this.view.render(texts);
      });
  },

  /**
  * This renders the main game
  */
  gameAction: function() {
    var _this = this,
      id = _this.request.param('id'),
      level = parseInt(_this.request.param('level'), 10) || 1,
      isDaily = parseInt(_this.request.param('isDaily'),10) || 0;

    _this.increaseStat('level'+ level + '_count_played');

    if(typeof id === 'undefined'){

      //give random game
      _this.mongodb
        .collection('assemble_games')
        .find({active: true})
        .toArray(function(err, game) {

          // Get a random element
          game = game[Math.floor(game.length*Math.random())];

          _this.renderGame(game, level, function(err, buildingParts){
            _this.view.render({
              title: 'Baukasten - ToyBlocks',
              game: game,
              buildingparts: buildingParts
            });
          });
        });
    }else{

      //give game according to id
      if(isDaily){
        _this.view.setOnlyContent(true);
      }

      _this.mongodb
        .collection('assemble_games')
        .find({_id: _this.mongo.ObjectID(id), active: true})
        .nextObject(function(err, game) {
          _this.renderGame(game, level, function(err, buildingParts){
            _this.view.render({
              title: 'Baukasten - ToyBlocks',
              game: game,
              isDaily: isDaily,
              buildingparts: buildingParts
            });
          });
        });
    }
  },

  /**
   * This renders the main game
   * Gets the buildings from the database and returns it with a callback
   *
   * @param game           - information about the current game
   * @param level          - with or without fake images
   * @param renderCallback - the callback to call after we got the buildings
   */
  renderGame: function(game, level, renderCallback) {
    var _this = this,
     partsLimit = game.limit || 15,
     countOfFakeImages = 3;

    _this.mongodb
    .collection('assemble_images')
    .find({assemble_category: game.assemble_category})
    .limit(partsLimit)
    .toArray( function(err, images){

      if(level === 2){

        // Add fake images to array
        var fakeIds = game.assemble_fakeimages;
        _this.mongodb
        .collection('assemble_images')
        .find({_id:{$in: fakeIds}})
        .limit(countOfFakeImages)
        .toArray(function(err2, fakes){

          for (var i = 0; i < fakes.length; i++) {
            images.push(fakes[i]);
          }
          images = _this.shuffleArray(images);
          renderCallback(err, images);
        });
      }else {
        images = _this.shuffleArray(images);
        renderCallback(err, images);
      }
    });
  },

  /**
   * POST request to check the solution
   * the parameters are from the <form> element
   *
   * @param gameid    - the id of the game
   * @param sortings  - an array of ids, shows how the images were sorted
   */
  checkSortingAction: function() {
    var _this = this,
      gameid  = _this.request.param('gameid'),
      sortIDs = _this.request.param('sortings');

    if(typeof sortIDs === 'undefined') {
      _this.response.json({ error: 'Keine Elemente ausgewählt.'});
      return;
    }
    // first we got the game params
    this.mongodb
      .collection('assemble_games')
      .find({_id: this.mongo.ObjectID(gameid)})
      .nextObject(function(err, game) {

        _this.mongodb
          .collection('assemble_images')
          .find({assemble_category: game.assemble_category})
          .toArray(function(err, images) {

            // check for correct number of building elements submitted
            if(images.length > sortIDs.length) {
              _this.response.json({
                error: 'Nicht genug Elemente ausgewählt.'
              });
              return;
            } else if(images.length < sortIDs.length) {
              _this.response.json({
                error: 'Zu viele Elemente ausgewählt.'
              });
              return;
            }

            var isElementCorrect = [],
                isSolutionCorrect = true;
            for (var i = 0; i < images.length; i++) {
              var index = images[i].assemble_order - 1;
              var isCorrect = parseInt(images[i]._id, 16) ===
                parseInt(sortIDs[index], 16);
              isElementCorrect.unshift(isCorrect);
              isSolutionCorrect = isSolutionCorrect && isCorrect;
            }
            
            // Update Stats
            Statistics.prototype.insertStats(_this, { $inc : { 'assemble': +1 }});

            _this.response.json({
              correct: isSolutionCorrect,
              order: isElementCorrect,
              solution: game.image
            });
          });
      });
  }
});
