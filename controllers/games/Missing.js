'use strict';

var GamesController = require('../Games'),
  Statistics = require('../moderation/Stats');
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
    this.view.render({
      title: 'Fehlstellen'
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
      id = _this.request.param('id'),
      level = parseInt(_this.request.param('level'),10) || 1,
      gamesLeft = parseInt(_this.request.param('gamesLeft'),10) || 3;

    _this.increaseStat('level'+level+'_count_played');
    if(typeof id !== "undefined"){
      _this.mongodb
      .collection('missingparts_games')
      .find({_id: _this.mongo.ObjectID(id)})
      .nextObject(
        function(err, game) {
        _this.renderGame(game, level, function(err, images){
          _this.view.render({
            title: 'Fehlstellen',
            game: game,
            level: level,
            mainimage: game.image,
            images: images,
            gamesLeft: gamesLeft
          });
        });
      });
    }else{
      _this.mongodb.collection('missingparts_games')
      .find() 
      .toArray(
        function(err, game) {
        //+ Jonas Raoni Soares Silva
        //@ http://jsfromhell.com/array/shuffle [v1.0]
        function shuffle(o){ //v1.0
          for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i),
           x = o[--i], o[i] = o[j], o[j] = x);
          return o;
        }
        game = game[Math.floor(game.length*Math.random())];

        _this.renderGame(game, level, function(err, images){
          _this.view.render({
            title: 'Fehlstellen',
            game: game,
            level: level,
            mainimage: game.image,
            images: images,
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
  renderGame: function(game, level, renderCallback) {
    var _this = this,
      type = game.missingparts_category,
      limit;

    switch (level){
      case 2:  limit = 8; break;
      case 3:  limit = 12; break;
      default: limit = 4; break;
    }

    //+ Jonas Raoni Soares Silva
    //@ http://jsfromhell.com/array/shuffle [v1.0]
    function shuffle(o){ //v1.0
      for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i),
       x = o[--i], o[i] = o[j], o[j] = x);
      return o;
    }

    //get one solution
    var solution = game.missingparts_correctimage[
        Math.floor(game.missingparts_correctimage.length * Math.random())];

    _this.mongodb
      .collection('missingparts_images')
      .find({
        missingparts_category: type,
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
      gameid  = _this.request.param('gameid'),
      attempt = _this.request.param('attempt'),
      level   = _this.request.param('level'),
      result  = _this.request.param('sortings');

    // TODO: implement clientside error detection
    if(result === undefined || gameid === undefined){
      _this.response.json({error:'Error'});
      return;
    }
    // get the game paramenters first
    _this.mongodb
    .collection('missingparts_games')
    .find( {_id: _this.mongo.ObjectID(gameid)} )
    .nextObject(
      function(err, game) {

      // lets see if the correct image is clicked
      var correctImageSelected = false,
          correctImageId = game.missingparts_correctimage;

      for (var i = 0; i < correctImageId.length; i++) {
        if(parseInt(result,16) ===
          parseInt(correctImageId[i],16)){
          correctImageSelected = true;
        }
      }


      // Update Stats
      var userId  = _this.request.session.user.tuid;
      Statistics.prototype.insertStats(_this, 'missing', gameid, level, userId, attempt, correctImageSelected);

      // send the solution back to client
      _this.response.json( {
        correct: correctImageSelected,
        correctBuilding: correctImageId,
        solutionImage: game.missingparts_solutionimage
      });
    });
  }
});
