'use strict';

var GamesController = require('../Games'),
  Statistics = require('../admin/Stats');

module.exports = function () { };

module.exports.prototype = GamesController.prototype.extend({
  name: 'daily',
  rightLevel: 300,

  /**
  * Intern function
  * 
  */
  hasUserPlayedDaily: function (db, tuid, callback) {
    var todaysUnixDate = new Date().getTime() - (new Date().getTime() % 86400000);

    db.mongodb
      .collection('daily_leaderboard')
      .find({ date: todaysUnixDate })
      .next(function (_err, leaderboardData) {

        if (!!leaderboardData && !!leaderboardData.players) {
          var players = leaderboardData.players;
          for (var i = 0; i < players.length; i++) {
            if (players[i].tuid == tuid) {
              callback(true);
              return;
            }
          }
        }
        callback(false);
      });
  },

  /**
  * GET index Page for DailyChallenge
  */
  indexAction: function () {
    var _this = this,
      userId = _this.request.session.user.tuid,
      todaysUnixDate = new Date().getTime() - (new Date().getTime() % 86400000);


    _this.hasUserPlayedDaily(_this, userId, function (hasPlayed) {

      _this.mongodb
        .collection('users')
        .find({ right_level: 300 })
        .count(function (_err, maxGamesPlayed) {
          maxGamesPlayed = maxGamesPlayed || 1;
          /*
            FIXME: HIER STECKT DER WURM DRINNE


            count sollte nicht benutzt werden
          */
          _this.mongodb
            .collection('daily_leaderboard')
            .find({ date: todaysUnixDate })
            .count(function (_err, currentGamesPlayed) {
              currentGamesPlayed = currentGamesPlayed || 0;
              _this.view.render({
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
    var todaysUnixDate = new Date().getTime() - (new Date().getTime() % 86400000);
    var givenUnixDate = parseInt(_this.request.query.date) || todaysUnixDate;
    var yesterdayUnixDate = givenUnixDate - 86400000;
    var tomorrowUnixDate = givenUnixDate + 86400000;

    _this.mongodb
      .collection('daily_leaderboard')
      .find({ date: givenUnixDate })
      .next(function (_err, data) {
        var users = [];
        if (!!data && !!data.players) {
          users = data.players;
        }
        users.sort(function (a, b) {
          if (a.score == b.score)
            return (+(a.time) > +(b.time)) ? 1 : -1;
          else
            return (a.score > b.score) ? -1 : 1;
        });
        for (var i = 0; i < users.length; i++) {
          users[i].time = ((users[i].time - (users[i].time % 1000)) / 1000);
          users[i].index = i + 1;
          users[i].highlight = _this.request.session.user.tuid === users[i].tuid;
        }

        var d = new Date(givenUnixDate);
        var game = {
          year: d.getFullYear(),
          month: d.getMonth() + 1,
          day: d.getDate()
        };

        _this.view.render({
          title: 'Bestenliste - Daily Challenge - ToyBlocks',
          game: game,
          players: users,
          yesterday: yesterdayUnixDate,
          hasBeenPlayed: users.length === 0,
          hasTomorrow: todaysUnixDate !== givenUnixDate,
          tomorrow: tomorrowUnixDate,
          userid: _this.request.session.user.tuid
        });
      });
  },

  /* GET daily game
  *  @return games - list of games
  */
  gameAction: function () {
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
      } else {

        _this.mongodb
          .collection('daily_games')
          .find()
          .next(function (_err, ele) {
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
  resultAction: function () {
    var _this = this;
    var result = _this.request.query.result.split(';');
    var playtime = _this.request.query.time;
    var tuid = _this.request.session.user.tuid;
    var nickname = _this.request.session.user.nickname;
    var points = 0;
    var count = 0;
    var gamelength = 0;
    var bounspoints_mc = true;
    var bounspoints_sort1 = true;
    var bounspoints_sort2 = true;
    var bounspoints_miss = true;
    var bounspoints_ass1 = true;
    var bounspoints_ass2 = true;

    var resultelement = [
      { type: 'assemble', title: 'Baukasten' },
      { type: 'assemble', title: 'Baukasten' },
      { type: 'missing', title: 'Fehlstellen' },
      { type: 'sort', title: 'Zeitstrahl' },
      { type: 'sort', title: 'Zeitstrahl' },
      { type: 'multiple', title: 'Multiplechoice' }
    ];

    for (let i = 0; i < result.length; i++) {
      let singlegame = result[i].split(',');
      resultelement[i].singles = singlegame;
      for (let j = 0; j < singlegame.length; j++) {
        let c = (singlegame[j] === 'true');
        if (c) { count++; }
        gamelength++;

        if (i === 5) { // multiplechoice
          if (c) { points += 14; } else { bounspoints_mc = false; }
        }
        if (i === 4) { // sorting 2
          if (c) { points += 7; } else { bounspoints_sort2 = false; }
        }
        if (i === 3) { // sorting 1
          if (c) { points += 7; } else { bounspoints_sort1 = false; }
        }
        if (i === 2) { // missing
          if (c) { points += 10; } else { bounspoints_miss = false; }
        }
        if (i === 1) { // ass2
          if (c) { points += 6; } else { bounspoints_ass2 = false; }
        }
        if (i === 0) { // ass1
          if (c) { points += 6; } else { bounspoints_ass1 = false; }
        }
      }
    }

    if (bounspoints_mc) { points += 50; }
    if (bounspoints_sort1) { points += 129; }
    if (bounspoints_sort2) { points += 129; }
    if (bounspoints_miss) { points += 49; }
    if (bounspoints_ass1) { points += 51; }
    if (bounspoints_ass2) { points += 52; }


    _this.hasUserPlayedDaily(_this, tuid, function (hasPlayed) {
      if (hasPlayed && tuid != 'developer') {
        _this.view.render({
          title: 'Daily Challenge - ToyBlocks',
          error: 'Sie haben bereits das heutige Daily gespielt!'
        });
      } else {

        /*TODO: sometimes on the server the time is off, I don't know why */
        var todaysUnixDate = new Date().getTime() - (new Date().getTime() % 86400000),
          player = {
            tuid: tuid,
            nickname: nickname,
            score: points,
            time: playtime
          };

        _this.mongodb
          .collection('daily_leaderboard')
          .updateOne({ date: todaysUnixDate },
            {
              $push: {
                players: player
              }
            }, { upsert: true },
            function () {
              var d = new Date();
              var game = {
                year: d.getFullYear(),
                month: d.getMonth() + 1,
                day: d.getDate()
              };

              Statistics.prototype.insertStats(_this, 'daily');

              _this.view.render({
                title: 'Daily Challenge - ToyBlocks',
                result: resultelement,
                game: game,
                pointsmax: gamelength,
                pointscur: count,
                procentwrong: (1 - (count / gamelength)) * 100,
                procentright: (count / gamelength) * 100,
                userid: tuid
              });
            });
      }
    });
  }
});


/**
*  Timed function that generates every day a new set of games
*  Gets called from jobs.js
*/
module.exports.generateDailyGame = function generateDailyGame(mongodb) {
  // Fisher-Yates Shuffle from Jonas Raoni Soares Silva
  // @ http://jsfromhell.com/array/shuffle
  function shuffleArray(o) { //v1.0
    for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i),
      x = o[--i], o[i] = o[j], o[j] = x);
    return o;
  }

  // get all the games
  mongodb
    .collection('missingparts_games')
    .find({ active: true }, { _id: 1 })
    .toArray(function (_err, mis) {
      mongodb
        .collection('sorting_buildings')
        .find({ active: true }, { _id: 1 })
        .toArray(function (_err1, sor) {
          mongodb
            .collection('multiplechoice_questions')
            .find({ active: true }, { _id: 1 })
            .toArray(function (_err2, mul) {
              mongodb
                .collection('assemble_games')
                .find({ active: true }, { _id: 1 })
                .toArray(function (_err3, ass) {

                  //missing
                  mis = shuffleArray(mis).slice(0, 2);
                  for (let i = 0; i < mis.length; i++) {
                    mis[i] = mis[i]._id;
                  }

                  //sorting
                  let sor1 = shuffleArray(sor).slice(0, 7);
                  let sor2 = shuffleArray(sor).slice(0, 7);
                  for (let i = 0; i < sor1.length; i++) {
                    sor1[i] = sor1[i]._id;
                    sor2[i] = sor2[i]._id;
                  }

                  //multiple
                  mul = shuffleArray(mul).slice(0, 5);
                  for (let j = 0; j < mul.length; j++) {
                    mul[j] = mul[j]._id;
                  }

                  //assemble games
                  ass = shuffleArray(ass).slice(0, 2);
                  for (let i = 0; i < ass.length; i++) {
                    ass[i] = ass[i]._id;
                  }

                  // we got 5 multiplechoice
                  //        2 missing
                  //        2 sorting
                  //        2 assemble

                  mongodb
                    .collection('daily_games')
                    .updateOne({},
                      {
                        $set:
                        {
                          missing: mis.join(','),
                          sorting: sor1.join(','),
                          sorting2: sor2.join(','),
                          multiplechoice: mul.join(','),
                          assemble: ass[0],
                          assemble2: ass[1]
                        }
                      },
                      {},
                      function () {
                        // do nothing
                      });
                });
            });
        });
    });
};