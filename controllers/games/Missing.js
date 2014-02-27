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
    .find({_random: {$near: [Math.random(), 0]}})
    .limit(3)
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
    var _this = this,
      id = this.request.param('id'),
      level = parseInt(this.request.param('level'),10) || 1,
      gamesLeft = parseInt(this.request.param('gamesLeft'),10) || 3;
      console.log(id);

    //TODO: remove first if code, we shouldn't need it
    if(typeof id !== "undefined"){
      this.mongodb
      .collection('missingparts_games')
      .find({_id: this.mongo.ObjectID(id)})
      .nextObject(function(err, game) {
        _this.renderGame(game, 4, function(err, images){
          _this.view.render({
            title: 'Fehlstellen-Spiel',
            game: game,
            mainimage: game.image,
            images: images
          });
        });
      });
    }else{
      var limit;
      switch (level){
        case 2:
        limit = 6;
        break;
        case 3:
        limit = 10;
        break;
        default:
        limit = 4;
        break;
      }

      // TODO: When database is filled remove the following
      // shuffle and insert this into the find
      //  .find({_random: {$near: [Math.random(), 0]}})
      this.mongodb
      .collection('missingparts_games')
      .find() 
      .toArray(function(err, game) {
        //+ Jonas Raoni Soares Silva
        //@ http://jsfromhell.com/array/shuffle [v1.0]
        function shuffle(o){ //v1.0
          for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i),
           x = o[--i], o[i] = o[j], o[j] = x);
          return o;
        }
        game = shuffle(game)[0];

        _this.renderGame(game, limit, function(err, images){
          _this.view.render({
            title: 'Fehlstellen-Spiel',
            game: game,
            mainimage: game.image,
            images: images,
            level: level,
            gamesLeft: gamesLeft
          });
        });
      });
    }
  },

  /**
  *  renderGame() fetches images from mongodb
  *
  * @param <Array> game
  * @param <Callback> renderCallback
  * @return <Array> images in Callback
  */
  renderGame: function(game, limit, renderCallback) {
    var _this = this,
      type = game.missingparts_category;

    //+ Jonas Raoni Soares Silva
    //@ http://jsfromhell.com/array/shuffle [v1.0]
    function shuffle(o){ //v1.0
      for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i),
       x = o[--i], o[i] = o[j], o[j] = x);
      return o;
    }

    //get one solution
    var solution = shuffle(game.missingparts_correctimage)[0];

    _this.mongodb
      .collection('missingparts_images')
      .find({
        missingparts_category: type,
        _random: {$near: [Math.random(), 0]},
        _id: {$nin: game.missingparts_correctimage}}) // no 2 solutions
      .limit(limit-1)
      .toArray(
        function (err, images) {
        _this.mongodb
        .collection('missingparts_images')
        .find({_id: _this.mongo.ObjectID(solution.toString()) })
        .nextObject(
          function (err2, images2) {
          images.push(images2);
          images = shuffle(images);
          renderCallback(err, images);
        });
      });
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

    // TODO: implement clientside error detection
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
