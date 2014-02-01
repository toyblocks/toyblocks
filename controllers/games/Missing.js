var GamesController = require('../Games'),
attributeModel = require('../../models/Attribute');

module.exports = function () {

};

module.exports.prototype = GamesController.prototype.extend({
  name: 'missing',

  // overview of games
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

  // actual missingparts game
  // @returns game information and game images
  gameAction: function() {
    var _this = this;
    this.mongodb
    .collection('missingparts_games')
    .find({_id: this.mongo.ObjectID(this.request.param('id'))})
    .nextObject(function(err, game) {
      _this.renderGame(game, function(err, images){
        _this.view.render({
          title: "Fehlstellen-Spiel",
          game: game,
          mainimage: game.image,
          images: images
          });
      });
    });
  },

  // gathers images from mongodb
  renderGame: function(game, renderCallback) {
    var type = game.category;
    // filter buildings by category
    if (type) {
      this.mongodb
        .collection('missingparts_images')
        .find({category: type}) //, _random: {$near: [Math.random(), 0]}})
        .toArray(renderCallback);
        // TODO: add random and limit count of images?
    }
    else {
      // should never happen
      console.log("[FAIL]: missing game.category for missingparts game.id: " + game._id + " - \ncheck the database for corrupt or missing data.");
      this.mongodb
        .collection('missingparts_images')
        .find({_random: {$near: [Math.random(), 0]}})
        .toArray(renderCallback);
    }
  },
  
  // checks if game selection is correct
  checkSelectedAction: function(res, req) {
    var _this = this;
    var result = this.request.param('result');
    var selected = _this.request.param('selects');
    var gameid = this.request.param('gameid');

    // get the game paramenters first
    this.mongodb
    .collection('missingparts_games')
    .find( {_id: this.mongo.ObjectID(gameid)} )
    .nextObject(function(err, game) {

      // get the image data now
      _this.mongodb
      .collection('missingparts_images')
      .find( { category: game.category })
      .toArray(function(err, images) {

        // lets see if the correct image is clicked
        var correctImageSelected = false,
            correctImageNumber = -1;
        for (var i = 0; i < images.length; i++) {

          // TODO: we should not compare string names
          // TODO: the db should have a reference to the img id
          if(images[i].title === game.correctpart) {
            if(result === i) {
              correctImageSelected = true;
            }
            correctImageNumber = i;
          }
        };

        // send the solution back to client
        _this.response.json( {
          correct: correctImageSelected,
          correctBuilding: correctImageNumber
        });
      })
    })
  }
});