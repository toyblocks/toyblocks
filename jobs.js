// Jobs, Steve Jobs
'use strict';


var cronJob = require('cron').CronJob,
  daily = require('./controllers/games/Daily.js');


module.exports.initJobs = function initJobs (mongodb) {
  // run every monday at 5am
  new cronJob('0 5 * * 1', function() {
    console.log('Die Woche hat begonnen und es ist 5 Uhr morgens.');
    daily.generateDailyGame(mongodb);
    
  }, null, true);


  // run every monday at 5am
  new cronJob('25 * * * *', function() {
    console.log('Es ist 11 min.');
  }, null, true);  
}
