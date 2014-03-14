'use strict';

var GamesController = require('../Games'),
  Statistics = require('../moderation/Stats');

module.exports = function () {
};

module.exports.prototype = GamesController.prototype.extend({
  name: 'assemble',

/** This Method is used for the game index page,
  * Collect the game data from the database and show it
  *
  * @return title - the title of the game
  * @return assembleGames - an array of Games
  */
  indexAction: function() {
    this.view.render({
      title: 'Baukasten'
    });
  },

  /**
   * This renders the main game
   *
   * @return game - information about the game, like title
   * @return buildingParts - array of buildingParts to display for the template
   */
  gameAction: function() {
    var _this = this,
      id = _this.request.param('id'),
      level = parseInt(_this.request.param('level'),10);

    _this.increaseStat('level'+level+'_count_played');
    if(typeof id !== "undefined"){
      _this.mongodb
        .collection('assemble_games')
        .find({_id: _this.mongo.ObjectID(id)})
        .nextObject(function(err, game) {
          _this.renderGame(game, level, function(err, buildingParts){
            _this.view.render({
              title: 'Baukasten',
              game: game,
              buildingparts: buildingParts
            });
          });
        });
    }else{
      _this.mongodb
        .collection('assemble_games')
        .find()
        .toArray(function(err, game) {

          // Get a random element
          game = game[Math.floor(game.length*Math.random())];

          _this.renderGame(game, level, function(err, buildingParts){
            _this.view.render({
              title: 'Baukasten',
              game: game,
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
   * @param difficulty     - normal images or with foul images?
   * @param renderCallback - the callback to call after we got the buildings
   */
  renderGame: function(game, difficulty, renderCallback) {
    var _this = this,
     partsLimit = game.limit || 15,
     level = difficulty || 1,
     countOfFakeImages = 3;

    //+ Jonas Raoni Soares Silva
    //@ http://jsfromhell.com/array/shuffle [v1.0]
    function shuffle(o){ //v1.0
      for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i),
        x = o[--i], o[i] = o[j], o[j] = x);
      return o;
    }

    _this.mongodb
    .collection('assemble_images')
    .find({assemble_category: game.assemble_category})
    //,_random: {$near: [Math.random(), 0]}
    .limit(partsLimit)
    .toArray( function(err, images){

      if(level === 1){
        images = shuffle(images);
        renderCallback(err, images);

      }else if(level === 2){

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
          images = shuffle(images);
          renderCallback(err, images);
        });
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
      sortIDs = _this.request.param('sortings'),
      attempt = _this.request.param('attempt'),
      level   = _this.request.param('level'),
      userId  = _this.request.session.user.tuid;

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
            Statistics.prototype.insertStats(_this, 'assemble', gameid, level, userId, attempt, isSolutionCorrect);

            _this.response.json({
              correct: isSolutionCorrect,
              order: isElementCorrect,
              solution: game.image
            });

          });
      });
  }
});
