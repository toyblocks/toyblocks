'use strict';

var GamesController = require('../Games');

module.exports = function () {};

module.exports.prototype = GamesController.prototype.extend({
  name: 'missing',

  /**
  *  indexAction() answers GET requests
  *  for the overview of missingpart games
  *
  * @return <String> title Title of indexpage
  * @return <Array> data
  */
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

  /**
  *  gameAction() answers GET requests
  *  for actual missingparts game
  *
  * @return <String> title
  * @return <Array> game
  * @return <String> mainimage
  * @return <Array> images
  */
  gameAction: function() {
    var _this = this;
    this.mongodb
    .collection('missingparts_games')
    .find({_id: this.mongo.ObjectID(this.request.param('id'))})
    .nextObject(function(err, game) {
      _this.renderGame(game, function(err, images){
        _this.view.render({
          title: 'Fehlstellen-Spiel',
          game: game,
          mainimage: game.image,
          images: images
        });
      });
    });
  },

  /**
  *  renderGame() fetches images from mongodb
  *
  * @param <Array> game
  * @param <Callback> renderCallback
  * @return <Array> images in Callback //FIXME: what is the type of a callback?
  */
  renderGame: function(game, renderCallback) {
    var type = game.category;

    // filter buildings by category
    if (type) {

        // TODO: limit count of images and include correct one
      this.mongodb
        .collection('missingparts_images')
        .find({category: type, _random: {$near: [Math.random(), 0]}})
        .toArray(renderCallback);
    }
    else {

      // should never happen
      console.error('[FAIL]: missing game.category for missingparts game.id: ' +
       game._id + ' - \ncheck the database for corrupt or missing data.');
      this.mongodb
        .collection('missingparts_images')
        .find({_random: {$near: [Math.random(), 0]}})
        .toArray(renderCallback);
    }
  },

  /**
  * checkSelectedAction() checks if game selection is correct
  *
  * @param <Number> result
  * @param <String> gameid
  * @return <Boolean> correct
  * @return <Number> correctBuilding
  */
  checkSelectedAction: function() {
    var _this = this,
     result = _this.request.param('result'),
     gameid = _this.request.param('gameid'),
     sortIDs = _this.request.param('sortings');
    // get the game paramenters first
    _this.mongodb
    .collection('missingparts_games')
    .find( {_id: _this.mongo.ObjectID(gameid)} )
    .nextObject(function(err, game) {

      // get the image data now
      _this.mongodb
      .collection('missingparts_images')
      .find( { category: game.category })
      .toArray(function(err, images) {

        // return error if no image was selected
        if(result < 0 || result > images.length){
          _this.response.json({
            error: 'Irgendwas ist schiefgegangen, versuchs nochmal.'
          });
          return;
        }

        // lets see if the correct image is clicked
        var correctImageSelected = false,
            correctImageNumber = -1,
            selected = sortIDs[result];

        if(parseInt(selected,16) ===
          parseInt(game.missingparts_correctimage[0],16)){
          correctImageSelected = true;
        }

        for (var i = 0; i < sortIDs.length; i++) {
          if(parseInt(sortIDs[i],16) ===
          parseInt(game.missingparts_correctimage[0],16)){
            correctImageNumber = i;
          }
        }

        // send the solution back to client
        _this.response.json( {
          correct: correctImageSelected,
          correctBuilding: correctImageNumber,
          solution: game.image // TODO: add solution img, fix bug in frontend
        });                    // TODO: cant have 2 img attr
      });
    });
  }
});
