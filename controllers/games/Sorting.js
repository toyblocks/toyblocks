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
    }
    else {
      this.mongodb
        .collection('buildings')
        .find({_random: {$near: [Math.random(), 0]}})
        .limit(buildingLimit)
        .toArray(renderCallback);
    }
  },

});