'use strict';

var BaseController = require('./Base');

module.exports = function () {

};
module.exports.prototype = BaseController.prototype.extend({
  area: 'admin',
  rightLevel: 100,

  checkAuth: function () {
    return true;
  },

  /**
  * Updates timestap on the lower right
  * Indicates when the database was last updated
  *
  */
  updateLastModifiedTimestamp: function () {
    this.mongodb
      .collection('system_config')
      .updateOne(
        { key: 'last_modified' },
        { $set: { key: 'last_modified', value: new Date() } },
        { upsert: true },
        function (err) {
          if (err)
            console.warn('Error in updateLastModifiedTimestamp.');
        }
      );
  }
});
