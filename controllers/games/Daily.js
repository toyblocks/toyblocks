'use strict';

var GamesController = require('../Games'),
  Statistics = require('../admin/Stats');

module.exports = function () {

};

module.exports.prototype = GamesController.prototype.extend({
  name: 'daily',

  /* Calculates how many people played todays Daily
  *@return percentGamesPlayed
  */ 
  getPercentGamesPlayed: function(){
    var _this = this;

    _this.mongodb
     .collection('users')
     .find({right_level: 300})
     .count(function (err, maxGamesPlayed) {
        maxGamesPlayed = maxGamesPlayed || 1;
      _this.mongodb
       .collection('daily_leaderboard')
       .find()
       .count(function (err, currentGamesPlayed) {
        currentGamesPlayed = currentGamesPlayed || 0;
        console.log(currentGamesPlayed, maxGamesPlayed);
        return ((currentGamesPlayed * 100) / maxGamesPlayed);;
      });
    });
  },

  /**
  * GET index Page for DailyChallenge
  */
  indexAction: function() {
    var _this = this,
      userId  = _this.request.session.user.tuid,
      played = _this.getPercentGamesPlayed();

    console.log(userId);
    _this.mongodb
     .collection('daily_leaderboard')
     .find({tuid: userId})
     .nextObject(function (err, user) {
      
      
      var hasPlayed = (typeof user === null);
      console.log(hasPlayed, userId, played);

      _this.view.render( {
        title: 'Daily Challenge',
        gamesPlayed: played,
        hasPlayedTodaysDaily: hasPlayed
      });
    });
  },

  // GET leaderboard webpage
  leaderboardAction: function () {
    var _this = this;

    _this.mongodb
    .collection('daily_leaderboard')
    .find()
    .sort({score: 1})
    .limit(15)
    .toArray(function (err, users) {
      /*if(typeof users === 'undefined'){
        users = [{
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
        }];*/
        
      var d = new Date();
      var game = {
        year: d.getFullYear(),
        month: d.getMonth()+1,
        day: d.getDate(),
        gamesPlayed: _this.getPercentGamesPlayed()
      };

      _this.view.render({
        title: 'Daily Challenge Bestenliste',
        game: game,
        players: users,
        userid: _this.request.session.user.tuid
      });
    });
  },

  /**
  *  Timed function that generates every day a new set of games
  */
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

  /* GET daily game
  *  @return games - list of games
  */ 
  gameAction: function() {
    var _this = this;
    var tuid = _this.request.session.user.tuid;
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

    _this.mongodb
    .collection('daily_leaderboard')
    .find({tuid: tuid})
    .nextObject(function (err, ele) {
      console.log(ele);
      if(!!ele){
        _this.view.render({
          title: 'Daily Challenge',
          error: 'Sie haben bereits das heutige Daily gespielt!'
        });
      }else{
        _this.view.render({
          title: 'Daily Challenge',
          games: games,
          missing: games.missing,
          sorting: games.sorting,
          assemble: games.assemble,
          multiplechoice: games.multiplechoice
        });
      }
    });
  },

  /* GET daily game
  *  @return games - list of games
  */ 
  resultAction: function() {
    var _this = this;
    var result =  _this.request.param('result');
    var tuid = _this.request.session.user.tuid;
    var points = 0;
    var count = 0.0;
    for (var i = 0; i < result.length; i++) {
      if(result[i]){
        points+=20;
        count+=1;
        if(points >= 500)
          points+=10;
        if(points >= 400)
          points+=5;
        if(points >= 200)
          points+=1;
      }
      if(points % 2)
        points+=1;
    }
    count = result.length/ count;
    console.log(result, points, count);

    _this.mongodb
    .collection('daily_leaderboard')
    .find({tuid: tuid})
    .nextObject(function (err, ele) {
      /* TODO: insert check
      if(!!ele){


      }else{
        _this.view.render({
          error: 'Error: Sie haben das Daily heute schon gespielt oder der Server macht Mist.'
        });
      }
      */

      // TODO: get the best players first, then add the player to them and sort
      _this.mongodb
      .collection('daily_leaderboard')
      .insert({ tuid: tuid,
              nickname: _this.request.session.user.tuid,
              score: points
        }, function (err, ele) {
          _this.mongodb
          .collection('daily_leaderboard')
          .find()
          .sort({score: 1})
          .limit(15)
          .toArray(function (err, players) {
            var d = new Date();
            var game = {
              year: d.getFullYear(),
              month: d.getMonth()+1,
              day: d.getDate(),
              gamesPlayed: _this.getPercentGamesPlayed()
            };

            /*
            * TODO: dont let other games increase the stats if they are in fact a daily game
            */

            Statistics.prototype.insertStats(_this, 'daily');

            _this.view.render({
              title: 'Daily Challenge',
              result: result,
              game: game,
              players: players,
              userid: _this.request.session.user.tuid
            });
          });    
        });
    });
  }
});
