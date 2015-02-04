'use strict';

var GamesController = require('../Games'),
  Statistics = require('../admin/Stats');

module.exports = function () {};

module.exports.prototype = GamesController.prototype.extend({
  name: 'daily',

  /**
  * GET index Page for DailyChallenge
  */
  indexAction: function() {
    var _this = this,
      userId  = _this.request.session.user.tuid;

    _this.mongodb
    .collection('daily_leaderboard')
    .find({tuid: userId})
    .nextObject(function (err, user) {

      var hasPlayed;
      if(!!user){
        hasPlayed = true;
      }
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
          _this.view.render( {
            title: 'Daily Challenge',
            gamesPlayed: (((currentGamesPlayed * 100) /
                          maxGamesPlayed)).toFixed(1),
            hasPlayedTodaysDaily: hasPlayed
          });
        });
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

  /* GET daily game
  *  @return games - list of games
  */
  gameAction: function() {
    var _this = this;
    var tuid = _this.request.session.user.tuid;
    var nickname = _this.request.session.user.nickname;

    if (!nickname) {
      _this.view.render({
        title: 'Daily Challenge',
        error: 'Sie haben noch keinen Nickname in ihrem Profil gesetzt!'
      });
      return;
    }

    _this.mongodb
    .collection('daily_leaderboard')
    .find({tuid: tuid})
    .nextObject(function (err, ele) {
      if (!!ele) {
        _this.view.render({
          title: 'Daily Challenge',
          error: 'Sie haben bereits das heutige Daily gespielt!'
        });
      }
      else {
        _this.mongodb
        .collection('daily_games')
        .find()
        .nextObject(function (err, ele) {
          _this.view.render({
            title: 'Daily Challenge',
            missing: ele.missing,
            sorting: ele.sorting2,
            sorting2: ele.sorting,
            assemble: ele.assemble,
            assemble2: ele.assemble2,
            multiplechoice: ele.multiplechoice
          });
        });
      }
    });
  },

  /* GET daily game
  *  @return games - list of games
  */
  resultAction: function() {
    var _this = this,
      result =  _this.request.param('result').split(','),
      tuid = _this.request.session.user.tuid,
      points = 0,
      count = 0,
      bounspoints_mc = true,
      bounspoints_sort1 = true,
      bounspoints_sort2 = true,
      bounspoints_miss = true,
      bounspoints_ass = true;

    // Iterate over result array and calculate bonus points
    for (var i = result.length-1; i >= 0; i--) {
      var c = (result[i] === 'true');
      if(c){
        count++;
      }

      // multiplechoice
      if(i >= (result.length-5)){
        if(c){ points += 14; }else{ bounspoints_mc = false; }
      }
      // sorting 2
      if(i >= (result.length-13) && i < (result.length-5)){
        if(c){ points += 7; }else{ bounspoints_sort2 = false; }
      }
      //sorting 1
      if(i >= (result.length-20) && i < (result.length-13)){
        if(c){ points += 7; }else{ bounspoints_sort1 = false; }
      }
      // missing
      if(i >= (result.length-25) && i < (result.length-20)){
        if(c){ points += 10; }else{ bounspoints_miss = false; }
      }
      // both assemble
      if(i < (result.length-25)){
        if(c){ points += 6; }else{ bounspoints_ass = false; }
      }
    }

    if(bounspoints_mc){    points+=50; }
    if(bounspoints_sort1){ points+=129; }
    if(bounspoints_sort2){ points+=129; }
    if(bounspoints_miss){  points+=50; }
    if(bounspoints_ass){   points+=50; }


    var todaysUnixDate = new Date().getTime() - ( new Date().getTime() % 86400000),
      player = {
        tuid: tuid,
        nickname: _this.request.session.user.nickname,
        score: points
    };


    _this.mongodb
    .collection('daily_leaderboard')
    .find({date: todaysUnixDate})
    .nextObject(function (err, ele) {

      var playersWithoutCurrent = ele.players;
      console.log("playersWithoutCurrent");
      console.log(playersWithoutCurrent);

      var contains = false;
      for (var i = 0; i < playersWithoutCurrent.length; i++) {
        if(String(playersWithoutCurrent[i].tuid) === String(tuid))
          contains = true;
      }

      if(contains){
        _this.view.render({
          error: 'Error: Sie haben das heutige Daily schon gespielt.'
        });
        return;
      }

      _this.mongodb
      .collection('daily_leaderboard')
      .update({ date: todaysUnixDate },
              {$push: {
                players: player
              }
            }, { upsert : true},
            function (err) {

              _this.mongodb
              .collection('daily_leaderboard')
              .find({date: todaysUnixDate})
              .nextObject(function (err, data) {

console.log("players");
console.log(players);
                var players = data.players;
                players.sort(function (a, b) {
                  return a.score < b.score;
                });
console.log("players");
console.log(players);

                if(!contains){
                  players.push(player);
                }

                var d = new Date();
                var game = {
                  year: d.getFullYear(),
                  month: d.getMonth()+1,
                  day: d.getDate()
                };

                Statistics.prototype.insertStats(_this, { $inc : { 'daily': +1 }});

                _this.view.render({
                  title: 'Daily Challenge',
                  result: result,
                  game: game,
                  pointsmax: result.length,
                  pointscur: count,
                  procentwrong: (1 - (count / result.length))*100,
                  procentright: (count / result.length)*100,
                  players: players,
                  userid: tuid
                });
              });
});
});
}
});


/**
*  Timed function that generates every day a new set of games
*  Gets called from jobs.js
*/
module.exports.generateDailyGame = function generateDailyGame (mongodb) {

  // TODO: somehow use _this.shuffleArray
  // but I don't know how right now
  function shuffleArray (o){ //v1.0
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i),
      x = o[--i], o[i] = o[j], o[j] = x);
    return o;
  }

  // get all the games
  mongodb
  .collection('missingparts_games')
  .find({active: true}, {_id: 1})
  .toArray(function(err, mis) {
    mongodb
    .collection('sorting_buildings')
    .find({active: true}, {_id: 1})
    .toArray(function(err, sor) {
      mongodb
      .collection('multiplechoice_questions')
      .find({active: true}, {_id: 1})
      .toArray(function(err, mul) {
        mongodb
        .collection('assemble_games')
        .find({active: true}, {_id: 1})
        .toArray(function(err, ass) {

          //missing
          mis = shuffleArray(mis).slice(0, 2);
          mis[0] = mis[0]._id;
          mis[1] = mis[1]._id;

          //sorting
          var sor1 = shuffleArray(sor).slice(0,7);
          var sor2 = shuffleArray(sor).slice(0,7);
          for (var i = 0; i < sor1.length; i++) {
            sor1[i] = sor1[i]._id;
            sor2[i] = sor2[i]._id;
          }

          //multiple
          mul = shuffleArray(mul).slice(0, 5);
          for (var j = 0; j < mul.length; j++) {
            mul[j] = mul[j]._id;
          }

          //assemble games
          ass = shuffleArray(ass).slice(0,2);
          ass[0] = ass[0]._id + '&level=2'; //TODO: randomize levels
          ass[1] = ass[1]._id + '&level=2';

          // we got 5 multiplechoice
          //        2 missing
          //        2 sorting
          //        2 assemble

          mongodb
          .collection('daily_games')
          .update({},
          {
            missing: mis.join(','),
            sorting: sor1.join(','),
            sorting2: sor2.join(','),
            multiplechoice: mul.join(','),
            assemble: ass[0],
            assemble2: ass[1]
          },
          {},
          function (err) {
            if(err)
              console.log('>> [DailyGame] Error at ' + new Date().getTime() + " - " + err);
            else{
              console.log('>> [DailyGame] Successfully generated new game at ' + new Date().getTime());
            }
          });
        });
      });
    });
  });
};