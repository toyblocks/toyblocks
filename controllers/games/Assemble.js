'use strict';

var GamesController = require('../Games');

module.exports = function () {

};

module.exports.prototype = GamesController.prototype.extend({
  name: 'assemble',

// This Method is used for the game index page,
// Collect the game data from the database and show it
//
// @return title - the title of the game
// @return assembleGames - an array of Games
  indexAction: function() {
    var _this = this;
    this.mongodb
      .collection('assemble_games')
      .find({})
      .toArray(function(err, assembleGames){
        _this.view.render({
          title: 'Zusammensetzen-Spiele',
          assemblegames: assembleGames
        });
      });
  },

// This renders the main game
//
// @return game - information about the game, like title
// @return buildingParts - an array of buildingParts to display for the template
  gameAction: function() {
    var _this = this;

    this.mongodb
      .collection('assemble_games')
      .find({_id: this.mongo.ObjectID(this.request.param('id'))})
      .nextObject(function(err, game) {
        _this.renderGame(game, function(err, buildingParts){
          _this.view.render({
            title: 'Zusammensetzen-Spiele',
            route: '/games/assemble',
            game: game,
            buildingparts: buildingParts
          });
        });
      });
  },

// Gets the buildings from the database and returns it with a callback
//
// @param game           - information about the current game
// @param renderCallback - the callback to call after we got the buildings
  renderGame: function(game, renderCallback) {
    var partsLimit = game.limit || 15;
    this.mongodb
      .collection('assemble_images')
      .find({assemble_category: game.assemble_category,
        _random: {$near: [Math.random(), 0]}
      }).limit(partsLimit)
      .toArray(renderCallback);
  },

// POST request to check the solution
// the parameters are from the <form> element
//
// @param gameid    - the id of the game
// @param sortings  - an array of ids, shows how the images were sorted
  checkSortingAction: function() {
    var _this = this;
    this.mongodb
      .collection('assemble_games')
      .find({_id: this.mongo.ObjectID(this.request.param('gameid'))})
      .nextObject(function(err, game) {
        // first we got the game params
        _this.mongodb
          .collection('assemble_images')
          .find({assemble_category: game.assemble_category})
          .toArray(function(err, images) {
            // got the era attribute with correct sorting of eras
            var sortIDs = _this.request.param('sortings');

            // check for correct number of building elements submitted

            if(images.length !== sortIDs.length) {
              _this.response.json({
                error: 'Nicht genug Elemente ausgewählt.'
              });
              return;
            }
            var isElementCorrect = [];
            var isSolutionCorrect = true;
            for (var i = 0; i < images.length; i++) {
              var index = images[i].assemble_order - 1;
              var isCorrect = parseInt(images[i]._id, 16) ===
                parseInt(sortIDs[index], 16);
              isElementCorrect.unshift(isCorrect);
              isSolutionCorrect = isSolutionCorrect && isCorrect;
            };
            _this.response.json({
              correct: isSolutionCorrect,
              order: isElementCorrect,
              solution: game.image
            });

          });
      });
  }
});
