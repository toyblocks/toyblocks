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
    var isDevelopment = process.env.NODE_ENV === "development";
    _this.mongodb
      .collection('users')
      .find({ 'tuid': _this.request.session.user.tuid })
      .next(function (_err, doc) {
        if (!doc) {
          if(isDevelopment){
            // Render something for development
            _this.view.render({
              title: 'Dev Profil',
              user: _this.request.session.user,
              isAdmin: _this.request.session.user.right_level === 100,
              isModerator: _this.request.session.user.right_level === 200,
              isStudent: _this.request.session.user.right_level === 300,
              count: _this.request.session.user.stats
            });
          }else{
            // user is not in DB, so lets log him out
            _this.response.redirect('/users/log/out');
          }
        } else {
          _this.view.render({
            title: 'Profil',
            user: doc,
            isAdmin: doc.right_level === 100,
            isModerator: doc.right_level === 200,
            isStudent: doc.right_level === 300,
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
    var newname = _this.request.body['nickname'];
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