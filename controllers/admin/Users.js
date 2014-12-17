'use strict';

var AdminController = require('../Admin');

module.exports = function () {

};
module.exports.prototype = AdminController.prototype.extend({
  name: 'users',

  indexAction: function() {
    var _this = this,
      countPerPage = 20,
      findParams = _this.getFindParams();

    _this.mongodb
      .collection('users')
      .count(function(err, totalCount) {
        _this.setPagination(totalCount, countPerPage);
        _this.mongodb
          .collection('users')
          .find(findParams)
          .sort( {surname: { $natural: 1 }} )
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
    var _this = this;
    _this.mongodb
      .collection('users')
      .update(
        {tuid: _this.request.param('tuid')},
        {$set: {'right_level': parseInt(_this.request.param('right_level'))}},
        {},
        function (err) {
          if(err)
            _this.response.json({result:'error'});
          else
            _this.response.json({result:'success'});
        });
  },

  deleteUser: function() {
    var _this = this;
    console.log("User Deleted called")
    _this.response.json({result:'success'});
    return;
    _this.mongodb
      .collection('users')
      .remove({_id: _this.request.param('id')}, {}, function() {
          if(err)
            _this.response.json({result:'error'});
          else
            _this.response.json({result:'success'});
        });
  }

});
