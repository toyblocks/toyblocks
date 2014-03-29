'use strict';

var cronJob = require('cron').CronJob;

// run every monday at 5am
new cronJob('0 5 * * 1', function() {
  console.log('Die Woche hat begonnen und es ist 5 Uhr morgens.');
}, null, true);
