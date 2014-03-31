// Steve Jobs
'use strict';


var cronJob = require('cron').CronJob,
  daily = require('./controllers/games/Daily.js');


module.exports.initJobs = function initJobs (mongodb) {
  // run every monday at 5am
  new cronJob('0 5 * * 1', function() {
    console.log('Die Woche hat begonnen und es ist 5 Uhr morgens.');
    
  }, null, true);

  daily.generateDailyGame(mongodb);
  // TODO: move generateDailyGame to daily at 5am
  // run every hour at 25 min
  new cronJob('0 * * * *', function() {
    daily.generateDailyGame(mongodb);
  }, null, true);  

  // TODO: move generateDailyGame to daily at 5am
  // run every hour at 25 min
  new cronJob('15 * * * *', function() {
    daily.generateDailyGame(mongodb);
  }, null, true);  


  // TODO: move generateDailyGame to daily at 5am
  // run every hour at 25 min
  new cronJob('30 * * * *', function() {
    daily.generateDailyGame(mongodb);
  }, null, true);


  // TODO: move generateDailyGame to daily at 5am
  // run every hour at 25 min
  new cronJob('45 * * * *', function() {
    daily.generateDailyGame(mongodb);
  }, null, true);
}
