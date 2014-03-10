'use strict';

var UsersController = require('../Users'),
  userModel = require('../../models/User');

module.exports = function () {

};
module.exports.prototype = UsersController.prototype.extend({
  name: 'index',
  rightLevel: 400,

  indexAction: function() {
    var _this = this;

    // TODO: create user database with attributes:
    // TODO: TU-ID, Username, lastLoggin (?), timesPlayed
    // TODO: hasPlayedDaily, DailyHighscore
    // TODO: isAdmin, ...
    var userId  = _this.request.session.user;
    _this.mongodb
      .collection(userModel.collection)
      .find({'tuid': _this.request.session.user.tuid})
      .nextObject(function(err, doc) {
        _this.view.render({
          title: 'Profil',
          user: doc
        });
      });
  }

});
