var GamesController = require('../Games'),
  attributeModel = require('../../models/Attribute');

module.exports = function () {
  
};
module.exports.prototype = GamesController.prototype.extend({
  name: 'sorting',

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

  gameAction: function() {
    var _this = this;

    this.mongodb
      .collection('sorting_games')
      .find({_id: this.mongo.ObjectID(this.request.param('id'))})
      .nextObject(function(err, game) {
        _this.renderGame(game, function(err, buildings){
          console.log(buildings);
          _this.view.render({
            game: game,
            buildings: buildings
          });
        });
      });
  },

  renderGame: function(game, renderCallback) {
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
              eras = attribute.values;
            for (var i = 0; i < sortIds.length; i++) {
              // we have to cast the mongo ids for the db-request
              sortIds[i] = _this.mongo.ObjectID(sortIds[i]);
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
                  // go through all buildings and check the index of era in era-array
                  var buildingEraIndex = eras.indexOf(buildings[i].era);
                  if (buildingEraIndex < lastEraIndex) {
                    correct = false;
                    break;
                  }
                  lastEraIndex = buildingEraIndex;
                  lastCorrectBuilding = i;
                }

                // response with a json object
                _this.response.json({
                  correct: correct,
                  lastCorrectBuilding: lastCorrectBuilding
                });
              });
          });
      });
  },

});