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
    'use strict';
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
    'use strict';
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
    'use strict';
    var type = game.category;

    // filter buildings by category
    if (type) {

        // TODO: add random and limit count of images?
      this.mongodb
        .collection('missingparts_images')
        .find({category: type}) //, _random: {$near: [Math.random(), 0]}})
        .toArray(renderCallback);
    }
    else {

      // should never happen
      console.log('[FAIL]: missing game.category for missingparts game.id: ' +
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
    'use strict';
    var _this = this,
     result = _this.request.param('result'),
     gameid = _this.request.param('gameid');

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

        // lets see if the correct image is clicked
        var correctImageSelected = false,
            correctImageNumber = -1;
        for (var i = 0; i < images.length; i++) {

          // TODO: we should not compare string names
          // TODO: the db should have a reference to the img id

          // parse Strings and Numbers to prevent bugs
          // and check them for equality
          if(String(images[i].title) === String(game.correctpart)) {
            if(Number(result) === Number(i)) {
              correctImageSelected = true;
            }
            correctImageNumber = i;
          }
        }

        // send the solution back to client

        _this.response.json( {
          correct: correctImageSelected,
          correctBuilding: correctImageNumber
        });
      });
    });
  }
});