'use strict';

var GamesController = require('../Games'),
  Statistics = require('../admin/Stats');

module.exports = function () {};

module.exports.prototype = GamesController.prototype.extend({
  name: 'daily',

  /**
  * Intern function
  * 
  */
  hasUserPlayedDaily: function (db, tuid, callback) {
    var todaysUnixDate = new Date().getTime() - ( new Date().getTime() % 86400000);

    db.mongodb
    .collection('daily_leaderboard')
    .find({date: todaysUnixDate})
    .nextObject(function (err, leaderboardData) {

      if(!!leaderboardData && !!leaderboardData.players){
        var players = leaderboardData.players;
        for (var i = 0; i < players.length; i++) {
          if(players[i].tuid == tuid){
            callback(true);
            return;
          }
        };
      }
      callback(false);
    });
  },

  /**
  * GET index Page for DailyChallenge
  */
  indexAction: function() {
    var _this = this,
      userId  = _this.request.session.user.tuid;

    _this.hasUserPlayedDaily(_this, userId, function (hasPlayed) {

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
              title: 'Daily Challenge - ToyBlocks',
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

    var todaysUnixDate = new Date().getTime() - ( new Date().getTime() % 86400000);

    _this.mongodb
    .collection('daily_leaderboard')
    .find({date: todaysUnixDate})
    .nextObject(function (err, data) {
      var users = [];
      if(!!data && !!data.players){
        users = data.players;
      }
      users.sort(function (a, b) {
        return (a.score > b.score) ? -1 : 1;
      });
      for (var i = 0; i < users.length; i++) {
        users[i].time = ((users[i].time - (users[i].time % 1000)) / 1000);
      }
        
      var d = new Date();
      var game = {
        year: d.getFullYear(),
        month: d.getMonth()+1,
        day: d.getDate()
      };

      _this.view.render({
        title: 'Bestenliste - Daily Challenge - ToyBlocks',
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
    var userId = _this.request.session.user.tuid;
    var nickname = _this.request.session.user.nickname;

    if (!nickname) {
      _this.view.render({
        title: 'Daily Challenge - ToyBlocks',
        error: 'Sie haben noch keinen Nickname in ihrem Profil gesetzt!'
      });
      return;
    }

    _this.hasUserPlayedDaily(_this, userId, function (hasPlayed) {

      if (hasPlayed && userId != 'developer') {  

        _this.view.render({
          title: 'Daily Challenge - ToyBlocks',
          error: 'Sie haben bereits das heutige Daily gespielt!'
        });
      }else {

        _this.mongodb
        .collection('daily_games')
        .find()
        .nextObject(function (err, ele) {
          _this.view.render({
            title: 'Daily Challenge - ToyBlocks',
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
      result =  _this.request.param('result').split(';'),
      playtime =  _this.request.param('time'),
      tuid = _this.request.session.user.tuid,
      nickname = _this.request.session.user.nickname,
      points = 0,
      count = 0,
      gamelength = 0,
      bounspoints_mc = true,
      bounspoints_sort1 = true,
      bounspoints_sort2 = true,
      bounspoints_miss = true,
      bounspoints_ass1 = true,
      bounspoints_ass2 = true;

      var resultelement = [
          {type: 'assemble', title: 'Baukasten'},
          {type: 'assemble', title: 'Baukasten'},
          {type: 'missing', title: 'Fehlstellen'},
          {type: 'sort', title: 'Zeitstrahl'},
          {type: 'sort', title: 'Zeitstrahl'},
          {type: 'multiple', title: 'Multiplechoice'}];

    for (var i = 0; i < result.length; i++) {
      var singlegame = result[i].split(',');
      resultelement[i].singles = singlegame;
      for (var j = 0; j < singlegame.length; j++) {
        var c = (singlegame[j] === 'true');
        if(c){ count++; }
        gamelength++;

        if(i === 5){ // multiplechoice
          if(c){ points += 14; }else{ bounspoints_mc = false; }}
        if(i === 4){ // sorting 2
          if(c){ points += 7; }else{ bounspoints_sort2 = false; }}
        if(i === 3){ // sorting 1
          if(c){ points += 7; }else{ bounspoints_sort1 = false; }}
        if(i === 2){ // missing
          if(c){ points += 10; }else{ bounspoints_miss = false; }}
        if(i === 1){ // ass2
          if(c){ points += 6; }else{ bounspoints_ass2 = false; }}
        if(i === 0){ // ass1
          if(c){ points += 6; }else{ bounspoints_ass1 = false; }}
      };
    };

    if(bounspoints_mc){    points+=50; }
    if(bounspoints_sort1){ points+=129; }
    if(bounspoints_sort2){ points+=129; }
    if(bounspoints_miss){  points+=49; }
    if(bounspoints_ass1){   points+=51; }
    if(bounspoints_ass2){   points+=52; }


    _this.hasUserPlayedDaily(_this, tuid, function (hasPlayed) {
      if (hasPlayed && tuid != 'developer') {
        _this.view.render({
          title: 'Daily Challenge - ToyBlocks',
          error: 'Sie haben bereits das heutige Daily gespielt!'
        });
      }else{

        /*TODO: sometimes on the server the time is off, I don't know why */
        var todaysUnixDate = new Date().getTime() - ( new Date().getTime() % 86400000),
          player = {
            tuid: tuid,
            nickname: nickname,
            score: points,
            time: playtime
        };

        _this.mongodb
        .collection('daily_leaderboard')
        .update({ date: todaysUnixDate },
                {$push: {
                  players: player
                }
              }, { upsert : true},
              function (err, data) {


                var d = new Date();
                var game = {
                  year: d.getFullYear(),
                  month: d.getMonth()+1,
                  day: d.getDate()
                };

                Statistics.prototype.insertStats(_this, { $inc : { 'daily': +1 }});

                _this.view.render({
                  title: 'Daily Challenge - ToyBlocks',
                  result: resultelement,
                  game: game,
                  pointsmax: gamelength,
                  pointscur: count,
                  procentwrong: (1 - (count / gamelength))*100,
                  procentright: (count / gamelength)*100,
                  userid: tuid
                });
            });
        };
      });
    }
});


/**
*  Timed function that generates every day a new set of games
*  Gets called from jobs.js
*/
module.exports.generateDailyGame = function generateDailyGame (mongodb) {

  var currenttime = new Date().getTime();

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
          ass[0] = ass[0]._id + '&level=2';
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
              console.log('>> [DailyGame] Error at ' + currenttime + ' - ' + err);
            else{
              console.log('>> [DailyGame] Successfully generated new game at ' + currenttime);
            }
          });
        });
      });
    });
  });
};