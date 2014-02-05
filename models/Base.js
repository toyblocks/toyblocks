'use strict';

var _ = require('underscore');

module.exports = function(db, data) {
  this.db = db;
  this.data = data;
};

module.exports.prototype = {
  extend: function(child) {
    return _.extend({}, this, child);
    /*
    var Child = module.exports;
    Child.prototype = module.exports.prototype;
    for(var key in properties) {
      Child.prototype[key] = properties[key];
    }
    return Child;
    */
  },
  setDB: function(db) {
    this.db = db;
  },
  collection: function() {
    if(this._collection)
      return this._collection;
    this._collection = this.db.collection(this.collection);
    return this._collection;
  }
};
