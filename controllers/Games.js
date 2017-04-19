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

  /**
  * Fisher-Yates Shuffle from Jonas Raoni Soares Silva
  * @ http://jsfromhell.com/array/shuffle
  * shuffles an array
  * 
  * @param <Array> o
  * @return <Array> o
  */
  shuffleArray: function (o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i),
      x = o[--i], o[i] = o[j], o[j] = x);
    return o;
  },


  /**
  * Creates an hash from given string
  * 
  * @param <Array> str
  * @return <Array> hash
  */
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
