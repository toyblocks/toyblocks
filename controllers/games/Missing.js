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
    var type = game.missingparts_category;

    // filter buildings by category
    if (type) {

        // TODO: limit count of images and include correct one
      this.mongodb
        .collection('missingparts_images')
        .find({missingparts_category: type, _random: {$near: [Math.random(), 0]}})
        .toArray(renderCallback);
    }
    else {

      // should never happen
      console.error('[FAIL]: missing game.missingparts_category for missingparts game.id: ' +
       game._id + ' - \ncheck the database for corrupt or missing data.');

      this.mongodb
        .collection('missingparts_images')
        .find({_random: {$near: [Math.random(), 0]}})
        .limit(4)
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
    gameid = _this.request.param('gameid'),
    result = _this.request.param('sortings');

    if(result === undefined){
      _this.response.json({error:'Error'});
      return;
    }
    // get the game paramenters first
    _this.mongodb
    .collection('missingparts_games')
    .find( {_id: _this.mongo.ObjectID(gameid)} )
    .nextObject(function(err, game) {

      // lets see if the correct image is clicked
      var correctImageSelected = false,
          correctImageId = game.missingparts_correctimage;

      for (var i = 0; i < correctImageId.length; i++) {
        if(parseInt(result,16) ===
          parseInt(correctImageId[i],16)){
          correctImageSelected = true;
        }
      }

      // send the solution back to client
      _this.response.json( {
        correct: correctImageSelected,
        correctBuilding: correctImageId,
        solutionImage: game.missingparts_solutionimage
      });
    });
  }
});
