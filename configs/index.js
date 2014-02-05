'use strict';

var extend = require('util')._extend;

var config = {
  mode: 'development',
  port: 3000,
  mongodb: {
    host: '127.0.0.1',
    port: 27017,
    db: 'toyblocks'
  }
};

module.exports = function(mode) {
  mode = mode || process.argv[2] || 'development';
  switch (mode)
  {
  case 'development':
    config.mode = 'development';
    config.port = 3000;
    break;
  case 'production':
    config.mode = 'production';
    config.port = 80;
    break;
  }
  return config;
};
