'use strict';

var GamesController = require('../Games');

module.exports = function () {

};

module.exports.prototype = GamesController.prototype.extend({
  name: 'daily',

  // Calculates how many people played todays Daily
  //
  // @return percentGamesPlayed
  getPercentGamesPlayed: function(){
    var _this = this;
    _this.mongodb.collection('users').find().count(function (err, maxGamesPlayed) {
      _this.mongodb.collection('users').find({hasPlayedDaily: true}).count(function (err, currentGamesPlayed) {
      return ((currentGamesPlayed * 100) / maxGamesPlayed);;
      });
    });
  },

  // GET index Page for DailyChallenge
  indexAction: function() {
    var _this = this,
      userId  = _this.request.session.user.tuid;
    console.log(userId);
    _this.mongodb.collection('users').find({tuid: userId}).nextObject(function (err, user) {
      console.log(user);
      var hasPlayed = false; //user.hasPlayedDaily || false;
      _this.view.render( {
        title: 'Daily Challenge',
        gamesPlayed: _this.getPercentGamesPlayed(),
        hasPlayedTodaysDaily: hasPlayed
      });
    });
  },


  // GET leaderboard webpage
  leaderboardAction: function () {
    var _this = this;

/*
    _this.mongodb.collection('users')
    .find() // {playedDaily: true }
    .toArray(function (err, users) {
      for (var i = 0; i < users.length; i++) {
        users[i]
      };
    });
*/
    var players = [{
      playerid: 1,
      pos: 1,
      name: 'FayeValentine',
      score: 1337,
      logo: 'none'
    },
       {
      playerid: 2,
      pos: 2,
      name: 'Edward',
      score: 1200,
      logo: 'none'
    },
      {
      playerid: 5,
      pos: 3,
      name: 'SpikeSpiegel',
      score: 1111,
      logo: 'none'
    },
       {
      playerid: 4,
      pos: 4,
      name: 'Ein',
      score: 734,
      logo: 'none'
    },
       {
      playerid: 3,
      pos: 5,
      name: 'Jet_Black',
      score: 234,
      logo: 'none'
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
      title: 'DailyChallenge',
      game: game,
      players: players,
      userid: 2
    });
  },

  // Timed function that generates every day a new set of games
  //
  generateDailyGame: function() {
    var _this = this;

    // TODO: render game every day at 0:00, save in mongodb
    // TODO: set hasPlayedDaily for all players to false
    // TODO: also insert date to mongodb
    // TODO: create a new leaderboard
    console.log('generating Daily Game');

    _this.mongodb
    .collection('missingparts_games')
    .find({})
    .toArray(function(err, data) {
      for (var i = data.length - 1; i >= 0; i--) {
        console.log('missingparts_games - ' + data[i].title);
      }
    });

    _this.mongodb
    .collection('sorting_games')
    .find()
    .toArray(function(err, data) {
      for (var i = data.length - 1; i >= 0; i--) {
        console.log('sorting_games - ' + data[i].title);
      }
    });
  },

  // GET daily game
  //
  // @return games - list of games
  gameAction: function() {
    var _this = this;

    // TODO: create a db entry for daily_games
    // let generateDailyGame create a game and send the entry back to client
    // TODO: figure out how to make multiple games on clientside work

    // this counts the available games
    // takes a random of each and sends it back to the client
    //_this.generateDailyGame();
    var games = {
      missing:  ['52fbe735ca0f3162348d7eca','5330e23d26e0a1ca6a000003'],
      sorting:  ['52d27d5bf5e06f0000000012,52d27cfbf5e06f000000000e,52d27cb2f5e06f000000000c,52d27c5df5e06f0000000008,52d27c8cf5e06f000000000a,52dbda81fcad941722e984a8,52d27d36f5e06f0000000010'],
      assemble: ['52f171d934e48b00006e0070'],
      multiplechoice: ['52f2aecb029240e1a4000008,5322314a855748ea73661eab,52f2af7b029240e1a400000a']
    };
    _this.view.render({
      title: 'Daily Challenge',
      games: games,
      missing: games.missing,
      sorting: games.sorting,
      assemble: games.assemble,
      multiplechoice: games.multiplechoice
    });
  },

    // GET daily game
  //
  // @return games - list of games
  resultAction: function() {
    var _this = this;

    var result =  _this.request.param('result');

    // TODO: Push result to db
    var players = [{
      playerid: 1,
      pos: 1,
      name: 'FayeValentine',
      score: 1337,
      logo: 'none'
    },
       {
      playerid: 2,
      pos: 2,
      name: 'Edward',
      score: 1200,
      logo: 'none'
    },
      {
      playerid: 5,
      pos: 3,
      name: 'SpikeSpiegel',
      score: 1111,
      logo: 'none'
    },
       {
      playerid: 4,
      pos: 4,
      name: 'Ein',
      score: 734,
      logo: 'none'
    },
       {
      playerid: 3,
      pos: 5,
      name: 'Jet_Black',
      score: 234,
      logo: 'none'
    }];

    var d = new Date();
    var game = {
      year: d.getFullYear(),
      month: d.getMonth()+1,
      day: d.getDate(),
      gamesPlayed: _this.getPercentGamesPlayed()
    };

    _this.view.render({
      title: 'Daily Challenge',
      result: result,
      game: game,
      players: players,
      userid: _this.request.session.user.tuid
    });
  }
});