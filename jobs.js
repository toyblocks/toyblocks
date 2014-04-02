// Steve Jobs
'use strict';


var cronJob = require('cron').CronJob,
  daily = require('./controllers/games/Daily.js');


module.exports.initJobs = function initJobs (mongodb) {

  // start the script daily at 00:01
  new cronJob('1 0 * * *', function() {
    daily.generateDailyGame(mongodb);
  }, null, true);  
}
