var GamesController = require('../Games'),
  attributeModel = require('../../models/Attribute');

module.exports = function () {
  
};

module.exports.prototype = GamesController.prototype.extend({
  name: 'assemble',

// This Method is used for the index page, see http://127.0.0.1:3000/games/multiplechoice
// Collect the game data from the database and show it
//
// @return title - the title of the game
// @return sortGames - an array of Games
  indexAction: function() {
    var _this = this;
    this.mongodb
      .collection('sorting_games')
      .find({})
      .toArray(function(err, sortGames){
        _this.view.render({
          title: 'Sortier Spiele',
          sortGames: sortGames
        });
      });
  },

// This renders the main game
//
// @return game - information about the game, like title
// @return buildings - an array of buildings to display for the template
  gameAction: function() {
    var _this = this;

    this.mongodb
      .collection('sorting_games')
      .find({_id: this.mongo.ObjectID(this.request.param('id'))})
      .nextObject(function(err, game) {
        _this.renderGame3(game, function(err, buildings){
          _this.view.render({
            game: game,
            buildings: buildings
          });
        });
      });
  },

// Gets the buildings from the database and returns ist with a callback
//
// @param game           - information about the current game
// @param renderCallback - the callback to call after we got the buildings
  renderGame3: function(game, renderCallback) {
    var buildingLimit = game.limit || 10;
    if (game.era && game.era.length > 0) {
      //filter buildings by era
      this.mongodb
        .collection('buildings')
        .find({era: {$in: game.era}, _random: {$near: [Math.random(), 0]}})
        .limit(buildingLimit)
        .toArray(renderCallback);
    }
    else {
      this.mongodb
        .collection('buildings')
        .find({_random: {$near: [Math.random(), 0]}})
        .limit(buildingLimit)
        .toArray(renderCallback);
    }
  },

// POST request to check the solution
// the parameters are from the <form> element
//
// @param gameid    - the id of the game
// @param sortings  - an array of ids, shows how the images were sorted
  checkSortingAction: function() {
    var _this = this;
    this.mongodb
      .collection('sorting_games')
      .find({_id: this.mongo.ObjectID(this.request.param('gameid'))})
      .nextObject(function(err, game) {
        // first we got the game params

        _this.mongodb
          .collection('attributes')
          .find({name: 'era'})
          .nextObject(function(err, attribute) {
            // got the era attribute with correct sorting of eras

            var sortIds = _this.request.param('sortings'),
              eras = attribute.values,
              sortedBuildings = {};
            for (var i = 0; i < sortIds.length; i++) {
              // we have to cast the mongo ids for the db-request
              sortIds[i] = _this.mongo.ObjectID(sortIds[i]);
              sortedBuildings[sortIds[i]] = null;
            }

            _this.mongodb.collection('buildings')
              .find({_id: {$in: sortIds}})
              .toArray(function(err, buildings) {
                // got all requested buildings, now calculate if sorting is right

                var lastEraIndex = 0,
                  lastCorrectBuilding = -1,
                  correct = true;
                // TODO:
                // gameparam: show last right
                // gameparam: show right solution
                // gameparam: show only correct or false
                // gameparam: num of possible tries

                for (var i = 0; i < buildings.length; i++) {
                  sortedBuildings[''+buildings[i]._id] = buildings[i];
                }

                var buildingIndex = 0;
                for (var _id in sortedBuildings) {
                  if (!sortedBuildings[_id])
                    continue;

                  // go through all buildings and check the index of era in era-array
                  var buildingEraIndex = eras.indexOf(sortedBuildings[_id].era);
                  
                  if (buildingEraIndex < lastEraIndex) {
                    correct = false;
                    break;
                  }
                  lastEraIndex = buildingEraIndex;
                  lastCorrectBuilding = buildingIndex;
                  buildingIndex++;
                }

                // response with a json object
                _this.response.json({
                  correct: correct,
                  lastCorrectBuilding: lastCorrectBuilding
                });
              });
          });
      });
  }
});