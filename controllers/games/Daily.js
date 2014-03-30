'use strict';

var GamesController = require('../Games'),
  Statistics = require('../admin/Stats'),
  _ = require('underscore');

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
        console.log(currentGamesPlayed, maxGamesPlayed, (((currentGamesPlayed * 100) / maxGamesPlayed)));
        return (((currentGamesPlayed * 100) / maxGamesPlayed));
      });
    });
  },

  /**
  * GET index Page for DailyChallenge
  */
  indexAction: function() {
    var _this = this,
      userId  = _this.request.session.user.tuid;
      //played = _this.getPercentGamesPlayed();

    console.log(userId);
    _this.mongodb
     .collection('daily_leaderboard')
     .find({tuid: userId})
     .nextObject(function (err, user) {
      
      
      var hasPlayed = !(typeof user === null);
      console.log(hasPlayed, userId);

      _this.view.render( {
        title: 'Daily Challenge',
        gamesPlayed: 66,
        hasPlayedTodaysDaily: hasPlayed
      });
    });
  },

  /* 
  * GET leaderboard webpage
  */
  leaderboardAction: function () {
    var _this = this;

    _this.mongodb
    .collection('daily_leaderboard')
    .find()
    .sort({score: -1})
    .limit(15)
    .toArray(function (err, users) {
        
      var d = new Date();
      var game = {
        year: d.getFullYear(),
        month: d.getMonth()+1,
        day: d.getDate()
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


    var games = {
      missing:  ['52fbe735ca0f3162348d7eca','5330e23d26e0a1ca6a000003'],
      sorting:  ['52d27d5bf5e06f0000000012,52d27cfbf5e06f000000000e,52d27cb2f5e06f000000000c,52d27c5df5e06f0000000008,52d27c8cf5e06f000000000a,52dbda81fcad941722e984a8,52d27d36f5e06f0000000010'],
      assemble: ['52f171d934e48b00006e0070&level=2'],
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
    var result =  _this.request.param('result').split(',');
    var tuid = _this.request.session.user.tuid;
    var points = 0;
    var count = 0;

    // TODO: make assemble and sorting games less worth
    for (var i = 0; i < result.length; i++) {
      console.log(result[i], (result[i]==='true'));
      if(result[i] === 'true'){
        count++;
        points+=10;
        if(points >= 1000)
          points+=10;
        if(points >= 500)
          points+=6;
        if(points >= 400)
          points+=4;
        if(points >= 200)
          points+=2;
      }
    }
    console.log(result, points, count, result.length);

    _this.mongodb
    .collection('daily_leaderboard')
    .find({tuid: tuid})
    .nextObject(function (err, ele) {
      if(!!ele){
        _this.view.render({
          error: 'Error: Sie haben das Daily heute schon gespielt oder der Server macht Mist.'
        });
        return;
      }
      
      // TODO: check if user has nickname set
      _this.mongodb
      .collection('daily_leaderboard')
      .insert({ tuid: tuid,
              nickname: _this.request.session.user.nickname,
              score: points
        }, function (err, ele) {

          _this.mongodb
          .collection('daily_leaderboard')
          .find()
          .sort({score: -1})
          .limit(2)
          .toArray(function (err, players) {
            
            console.log(ele);
            console.log(players);
            if(_.contains(players,ele)){
              console.log("is in best 2, yeahhhh");
            }else{
              console.log("not  in best, pushing");
              players.push(ele[0]);
            }
            //ele.concat(players);
            //ele.sort(function (a,b) {
//              return a > b;
            //});

            console.log(players);

            var d = new Date();
            var game = {
              year: d.getFullYear(),
              month: d.getMonth()+1,
              day: d.getDate()
            };

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
