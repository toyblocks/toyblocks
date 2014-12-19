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

  deleteAction: function() {
    var _this = this,
      id = _this.request.param('id');

    _this.mongodb
      .collection('users')
      .remove({_id: _this.mongo.ObjectID(id)}, 1, function(err) {
          if(err){
            _this.response.json({result:'error'});
          }
          else{
            _this.response.json({result:'success'});
          }
        });
  },


  deleteallusersAction: function() {
    var _this = this;

    _this.mongodb
      .collection('users')
      .remove({student: true, right_level: 300}, 0, function(err) {
          if(err)
            _this.response.json({result:'error'});
          else
            _this.response.json({result:'success'});
        });
  }

});
