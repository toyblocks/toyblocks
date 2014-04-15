'use strict';

var BaseController = require('./Base');

module.exports = function () {

};
module.exports.prototype = BaseController.prototype.extend({
  area: 'admin',
  rightLevel: 100,

  checkAuth: function() {
    return true;
  },

  updateLastModifiedTimestamp: function() {
    var _this = this;
    _this.mongodb
    .collection('system_config')
    .update({key: 'last_modified'},
            {key: 'last_modified', value: new Date()},
            {upsert: true},
            function(err) {
              if(err)
                console.log('Error in updateLastModifiedTimestamp.');
            });
  }
});
