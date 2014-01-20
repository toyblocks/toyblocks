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
        console.log(images);
        console.log("mainimage: \n" + game.image);
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
  
  checkSelectedAction: function(res, req) {
    console.log("checkSelectedAction");
    var _this = this;
    
    this.mongodb
    .collection('missingparts_games')
    .find( {id: this.mongo.ObjectID(this.request.param('_id'))} )
    .nextObject(function(err, game) {
      console.log(game)
      //we got the game params
      console.log("correct is: " + _this.request.param('correctpart'))

      _this.mongodb
      .collection('missingparts_images')
      .find()
      .nextObject(function(err, images) {
        var ImageIsCorrect = false, ImageNumber = -1;
        for (var i = 0; i < images.length; i++) {
          if(images[i].title == _this.request.param('correctpart')){
            ImageIsCorrect = true;
            ImageNumber = i;
          }
        };
        _this.response.json({
          correct: ImageIsCorrect,
          correctBuilding: ImageNumber
        });
      })        
//{ "title" : "Speyer-Krypta", "image" : ObjectId("52dd3d148453912c1d0c56a5"), "category" : "Kapitell", "correctpart" : [  "Würfelkapitell" ], "_id" : ObjectId("52dd3d148453912c1d0c56a6") }
//{ "title" : "Reims Kathedrale", "image" : ObjectId("52dd3de88453912c1d0c56a7"), "category" : "Fenster", "correctpart" : [  "Maßwerkfenster_Reims" ], "_id" : ObjectId("52dd3de88453912c1d0c56a8") }
    })
  }
});