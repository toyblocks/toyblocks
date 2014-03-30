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
    var userId  = _this.request.session.user;
    _this.mongodb
      .collection(userModel.collection)
      .find({'tuid': _this.request.session.user.tuid})
      .nextObject(function(err, doc) {
    console.log(doc);
        _this.view.render({
          title: 'Profil',
          user: doc
        });
      });
  },

  updatenicknameAction: function() {
    var _this = this;
    var newname = _this.request.param('nickname');
    var tuid = _this.request.session.user.tuid;
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
