var UsersController = require('../Users');


module.exports = function () {
  
};
module.exports.prototype = UsersController.prototype.extend({
  name: 'index',

  indexAction: function() {
    var _this = this;

    // TODO: create user database with attributes:
    // TODO: TU-ID, Username, lastLoggin (?), timesPlayed
    // TODO: hasPlayedDaily, DailyHighscore
    // TODO: isAdmin, ...
    _this.view.render({
      title: 'Account'
    });
  }

});