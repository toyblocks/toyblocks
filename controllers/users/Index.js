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
    _this.mongodb
      .collection(userModel.collection)
      .find({'tuid': _this.request.session.user.tuid})
      .nextObject(function(err, doc) {
        var count =  (doc.stats.assemble.level1_count_played        || 0) +
                      (doc.stats.assemble.level2_count_played       || 0) + 
                      (doc.stats.missing.level1_count_played        || 0) +
                      (doc.stats.missing.level2_count_played        || 0) +
                      (doc.stats.missing.level3_count_played        || 0) +
                      (doc.stats.multiplechoice.level1_count_played || 0) +
                      (doc.stats.multiplechoice.level2_count_played || 0) +
                      (doc.stats.sorting.level1_count_played        || 0) +
                      (doc.stats.sorting.level2_count_played        || 0) +
                      (doc.stats.sorting.level3_count_played        || 0);
        _this.view.render({
          title: 'Profil',
          user: doc,
          count_played: count
        });
      });
  },

  updatenicknameAction: function() {
    var _this = this;
    var newname = _this.request.param('nickname');
    var tuid = _this.request.session.user.tuid;

    /* apply name to session, so the user doesnt have to logout */
    _this.request.session.user.nickname = newname;

    _this.mongodb
      .collection('users')
      .update(
        {tuid: tuid},
        {$set: {'nickname': newname}},
        {},
        function (err) {
          if(err)
            _this.response.json({result:'Fehler'});
          else
            _this.response.json({result:'Gespeichert'});
        });
  }
});