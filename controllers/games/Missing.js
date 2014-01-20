var GamesController = require('../Games'),
attributeModel = require('../../models/Attribute');

module.exports = function () {

};

module.exports.prototype = GamesController.prototype.extend({
  name: 'missing',

  indexAction: function() {
    var _this = this;
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
    this.mongodb
    .collection('missingparts_games')
    .find({_id: this.mongo.ObjectID(this.request.param('id'))})
    .nextObject(function(err, game) {
      _this.renderGame(game, function(err, images){
        console.log("mainimage: " + game.image);
        _this.view.render({
          game: game,
          mainimage: game.image,
          images: images
          });
      });
    });
  },

  renderGame: function(game, renderCallback) {
    var type = game.category;
    console.log("rendered Game by type: " + type);
    //filter buildings by category
    if (type) {
      this.mongodb
        .collection('missingparts_images')
        .find({category: type}) //, _random: {$near: [Math.random(), 0]}
        .toArray(renderCallback);
    }
    else {
      console.log("missing type for game id: " + game._id);
      this.mongodb
        .collection('missingparts_images')
        .find({_random: {$near: [Math.random(), 0]}})
        .toArray(renderCallback);
    }
  },
  

  //TODO: create a parameter to see which item is selected !!!!!
  checkSelectedAction: function(res, req) {
    var _this = this;
    this.mongodb
    .collection('missingparts_games')
    .find( {_id: this.mongo.ObjectID(this.request.param('gameid'))} )
    .nextObject(function(err, game) {
      //we got the game params
      _this.mongodb
      .collection('missingparts_images')
      .find( { category: game.category })
      .toArray(function(err, images) {
        var selected = _this.request.param('selects');
        for (var i = 0; i < selected.length; i++) {
          console.log("! - " + selected[i]);
        };
        var ImageIsCorrect = false, ImageNumber = -1;
        for (var i = 0; i < images.length; i++) {
          console.log(i + " " + images[i].title + " - " + game.correctpart + " - " + images[i]._id + " - " + selected[i]);
          if(images[i].title == game.correctpart){
            ImageIsCorrect = true;
            ImageNumber = i;
            //break; //TODO: multiple correct solutions, remove later on
          }
        };

        _this.response.json({
          correct: ImageIsCorrect,
          correctBuilding: ImageNumber
        });
      })
    })
  }
});