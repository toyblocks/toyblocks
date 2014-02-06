'use strict';

var GamesController = require('../Games'),
attributeModel = require('../../models/Attribute');

module.exports = function () {

};

module.exports.prototype = GamesController.prototype.extend({
  name: 'daily',

  // Calculates how many people played todays Daily
  //
  // @return percentGamesPlayed
  getPercentGamesPlayed: function(){
    // TODO currentGamesPlayed = this.mongodb.collection('players').find( hasPlayedDaily: true).count()
    // TODO maxGamesPlayed = this.mongodb.collection('players').count()

    var currentGamesPlayed = 120,
        maxGamesPlayed = 200,
        percentGamesPlayed = (currentGamesPlayed * 100 / maxGamesPlayed);

    return percentGamesPlayed;
  },

  // GET index Page for DailyChallenge
  indexAction: function() {
    var _this = this;
    _this.view.render( {
      title: 'Daily Challenge',
      gamesPlayed: _this.getPercentGamesPlayed(),
      hasPlayedTodaysDaily: true
    });
  },


  // GET leaderboard webpage
  leaderboardAction: function () {
    var _this = this;

    //TODO: get proper player data from mongodb
    var players2 = [];
    var players = [{
      playerid: 1, pos: 1, name: 'FayeValentine', score: 1337, logo: 'none'},{
      playerid: 2, pos: 2, name: 'Edward', score: 1200, logo: 'none'}, {
      playerid: 5, pos: 3, name: 'SpikeSpiegel', score: 1111, logo: 'none'},{
      playerid: 4, pos: 4, name: 'Ein', score: 734, logo: 'none'},{
      playerid: 3, pos: 5, name: 'Jet_Black', score: 234, logo: 'none'
    }];

    // TODO: get date from dailychallenge database
    var d = new Date();
    var game = {
      year: d.getFullYear(),
      month: d.getMonth()+1,
      day: d.getDate(),
      gamesPlayed: _this.getPercentGamesPlayed()
    };

    _this.view.render({
      title: "DailyChallenge",
      game: game,
      players: players,
      userid: 2
    })
  },

  // Timed function that generates every day a new set of games
  //
  generateDailyGame: function() {
    var _this = this;

    // TODO: render game every day at 0:00, save in mongodb
    // TODO: set hasPlayedDaily for all players to false
    // TODO: also insert date to mongodb
    // TODO: create a new leaderboard
    console.log("generating Daily Game")
    var missing = _this.mongodb.collection('missingparts_games').find({}).toArray(function(err, data) {
      for (var i = data.length - 1; i >= 0; i--) {
        console.log("missingparts_games - " + data[i].title);
      };
    });

    sorting = _this.mongodb.collection('sorting_games').find().toArray(function(err, data) {
      for (var i = data.length - 1; i >= 0; i--) {
        console.log("sorting_games - " + data[i].title);
      };
    });
  },

  // GET daily game
  //
  // @return games - list of games
  gameAction: function() {
    var _this = this;

    // TODO: create a db entry for daily_games, let generateDailyGame create a game and send that entry back to the client
    // TODO: figure out how to make multiple games on clientside work

    // this counts the available games, takes a random of each and sends it back to the client
    //_this.generateDailyGame();
    var games;
    _this.mongodb.collection('missingparts_games').find().count(function (e, count1) {
      var random = Math.random() * count1;
      _this.mongodb.collection('missingparts_games').find().limit(-1).skip(random).next(function (err, ele1) {
        _this.mongodb.collection('sorting_games').find().count(function (e, count2) {
          random = Math.random() * count2;
          _this.mongodb.collection('sorting_games').find().limit(-1).skip(random).next(function (err, ele2) {
            games = [{
              id: ele1._id,
              type: "missing",
              title: ele1.title
            },{
              id: ele2._id,
              type: "sorting",
              title: ele2.title
            }];

            // log debug info
            console.log(ele1);
            console.log("games");
            console.log(games);

            // send data back to client
            _this.view.render({
              title: "DailyChallenge",
              games: games
            })
          });
        });
      });
    });
  }

});
