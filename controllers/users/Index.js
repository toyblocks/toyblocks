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
  indexAction: function() {
    var _this = this;
    _this.mongodb
      .collection(userModel.collection)
      .find({'tuid': _this.request.session.user.tuid})
      .nextObject(function(err, doc) {

        // Get how many games were played
        var count = 0;
        try{
          count += (doc.stats.assemble.level1_count_played       || 0);
          count += (doc.stats.assemble.level2_count_played       || 0);
          count += (doc.stats.missing.level1_count_played        || 0);
          count += (doc.stats.missing.level2_count_played        || 0);
          count += (doc.stats.missing.level3_count_played        || 0);
          count += (doc.stats.multiplechoice.level1_count_played || 0);
          count += (doc.stats.multiplechoice.level2_count_played || 0);
          count += (doc.stats.sorting.level1_count_played        || 0);
          count += (doc.stats.sorting.level2_count_played        || 0);
          count += (doc.stats.sorting.level3_count_played        || 0);
        }catch (e){
          console.log("Error catched in /controllers/users/Index.js", e);
        };
        
        _this.view.render({
          title: 'Profil',
          user: doc,
          count_played: count
        });
      });
  },

  /**
  * Updates Nickname for user
  * 
  */
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