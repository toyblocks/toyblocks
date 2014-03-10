'use strict';

var AdminController = require('../Admin');

module.exports = function () {

};
module.exports.prototype = AdminController.prototype.extend({
  name: 'users',

  indexAction: function() {
    var _this = this;
    _this.mongodb
      .collection('users')
      .find({})
      .toArray(function(err, users){
        _this.view.render({
          title: 'User Verwaltung',
          users: users
        });
      });
  },

  updateAction: function() {
    // this has a potential attack scenario
    
    var _this = this;
    _this.mongodb
      .collection('users')
      .update(
        {tuid: _this.request.param('tuid')},
        {$set: {'right_level': parseInt(_this.request.param('right_level'))}},
        {},
        function (err) {
          _this.response.json({result:'success'});
        });
  }

});
