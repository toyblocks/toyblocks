'use strict';

var BaseModel = require('./Base'),
  base = new BaseModel();

module.exports = base.extend({
  collection: 'users',

});