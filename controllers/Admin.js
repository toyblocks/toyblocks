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

  /**
  * Updates timestap on the lower right
  * Indicates when the database was last updated
  *
  */
  updateLastModifiedTimestamp: function() {
    var _this = this;
    _this.mongodb
    .collection('system_config')
    .updateOne({key: 'last_modified'},
            {key: 'last_modified', value: new Date()},
            {upsert: true},
            function(err) {
              if(err)
                console.log('Error in updateLastModifiedTimestamp.');
            });
  }
});
