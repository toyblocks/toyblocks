'use strict';

var AdminController = require('../Admin');

module.exports = function () {

};
module.exports.prototype = AdminController.prototype.extend({
  name: 'users',

  indexAction: function() {
    var _this = this,
      countPerPage = 20,
      page = _this.getPage();

    _this.mongodb
      .collection('users')
      .count(function(err, totalCount) {
        _this.setPagination(totalCount, countPerPage);
        _this.mongodb
          .collection('users')
          .find({})
          .skip(_this.getPaginationSkip())
          .limit(_this.getPaginationLimit())
          .toArray(function(err, users){
            _this.view.render({
              title: 'User Verwaltung',
              users: users
            });
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
