'use strict';

var UsersController = require('../Users'),
  userModel = require('../../models/User');

module.exports = function () {

};
module.exports.prototype = UsersController.prototype.extend({
  name: 'index',
  rightLevel: 400,

  /**
  * Shows profile page from user
  * 
  */
  indexAction: function () {
    var _this = this;
    _this.mongodb
      .collection(userModel.collection)
      .find({ 'tuid': _this.request.session.user.tuid })
      .next(function (err, doc) {

        if (!doc) {
          // user is not in DB, so lets log him out
          _this.response.redirect('/users/log/out');
        } else {
          _this.view.render({
            title: 'Profil',
            user: doc,
            count: doc.stats
          });
        }
      });
  },

  /**
  * Updates Nickname for user
  * 
  */
  updatenicknameAction: function () {
    var _this = this;
    var newname = _this.request.param('nickname');
    var tuid = _this.request.session.user.tuid;

    /* apply name to session, so the user doesnt have to logout */
    _this.request.session.user.nickname = newname;

    _this.mongodb
      .collection('users')
      .updateOne(
        { tuid: tuid },
        { $set: { 'nickname': newname } },
        {},
        function (err) {
          if (err)
            _this.response.json({ result: 'Fehler: ' + err });
          else
            _this.response.json({ result: 'Gespeichert' });
        });
  }
});