var extend = require('util')._extend;

var config = {
  mode: 'local',
  port: 3000,
  mongodb: {
    host: '127.0.0.1',
    port: 27017,
    db: 'toyblocks'
  }
};

module.exports = function(mode) {
  mode = mode || process.argv[2] || 'local';
  switch (mode)
  {
  case 'staging':
    config.mode = 'staging';
    config.port = 4000;
    break;
  case 'production':
    config.mode = 'production';
    config.port = 80;
    break;
  }
  return config;
};
