'use strict';

var BaseController = require('./Base');

module.exports = function () {

};
module.exports.prototype = BaseController.prototype.extend({
  area: 'games',
  rightLevel: 300,

  checkAuth: function() {
    return true;
  },

  shuffle1: function (array) {
    return array.sort(function () {
      return 0.5 - Math.random();
    });
  },

  //+ Jonas Raoni Soares Silva
  //@ http://jsfromhell.com/array/shuffle [v1.0]
  shuffleArray: function (o){ //v1.0
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i),
      x = o[--i], o[i] = o[j], o[j] = x);
    return o;
  },

  hashString: function ( str ){
    var hash = 0, i, l, char;
    if (str.length === 0) return hash;
    for (i = 0, l = str.length; i < l; i++) {
      char  = str.charCodeAt(i);
      hash  = ((hash<<5)-hash)+char;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }
});
