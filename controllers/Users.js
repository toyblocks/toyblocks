var BaseController = require('./Base');

module.exports = function () {
  
};
module.exports.prototype = BaseController.prototype.extend({
  area: 'users',

  checkAuth: function() {
    return true;
  }
});
