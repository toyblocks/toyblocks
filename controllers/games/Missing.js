var GamesController = require('../Games'),
  attributeModel = require('../../models/Attribute');

module.exports = function () {
  
};

module.exports.prototype = GamesController.prototype.extend({
  name: 'missing',

  indexAction: function() {
    var _this = this;
    console.log("indexAction")
    this.mongodb
      .collection('missingparts_games')
      .find({})
      .toArray(function(err, data){
        _this.view.render({
          title: 'Fehlstellen Spiele',
          data: data
        });
      });
  },

  gameAction: function() {
    var _this = this;
console.log("gameAction")
    this.mongodb
      .collection('missingparts_games')
      .find({_id: this.mongo.ObjectID(this.request.param('id'))})
      .nextObject(function(err, game) {
        _this.renderGame(game, function(err, buildings){
          console.log(buildings);
          _this.view.render({
            game: game,
            //main: 
            buildings: buildings
          });
        });
      });
  },

  renderGame: function(game, renderCallback) {
    console.log("renderGame")
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
  }
  checkSelectedAction: function() {
    var _this = this;
    this.mongodb
      .collection('missingparts_games')
      .find({_id: this.mongo.ObjectID(this.request.param('gameid'))})
      .nextObject(function(err, game) {
        //we got the game params

        // TODO create missinggame_pieces image db and insert data
        // also create a mainimage field inside missingparts_games db
          // _this.mongodb
          // .collection('attributes')
          // .find({name: 'corect'})
          // .nextObject(function(err, attribute) {
          // }

      }
  }

});