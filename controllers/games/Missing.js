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
        title: 'Fehlstellen-Spiel',
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
    //filter buildings by category
    if (type) {
      this.mongodb
        .collection('missingparts_images')
        .find({category: type}) //, _random: {$near: [Math.random(), 0]}
        .toArray(renderCallback);
    }
    else {
      console.log("[FAIL]: missing game.category for game.id: " + game._id + " - \ncheck to database for corrupt or missing data.");
      this.mongodb
        .collection('missingparts_images')
        .find({_random: {$near: [Math.random(), 0]}})
        .toArray(renderCallback);
    }
  },
  
  checkSelectedAction: function(res, req) {
    var _this = this;
    var result = this.request.param('result');
    var selected = _this.request.param('selects');
    var gameid = this.request.param('gameid');

    //get the game paramenters first
    this.mongodb
    .collection('missingparts_games')
    .find( {_id: this.mongo.ObjectID(gameid)} )
    .nextObject(function(err, game) {
      //get the image data now
      _this.mongodb
      .collection('missingparts_images')
      .find( { category: game.category })
      .toArray(function(err, images) {

        //lets see if the correct image is clicked
        var ImageIsCorrect = false, ImageNumber = -1;
        for (var i = 0; i < images.length; i++) {
          //TODO: we should not compare string names
          console.log(i + " - " + result + " - " + images[i].title + " == " + game.correctpart);
          if(images[i].title == game.correctpart){
            if(result == i){
              ImageIsCorrect = true;
            }
            ImageNumber = i;
          }
        };
        // send the solution back to client
        _this.response.json({
          correct: ImageIsCorrect,
          correctBuilding: ImageNumber
        });
      })
    })
  }
});