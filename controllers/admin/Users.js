'use strict';

var AdminController = require('../Admin');

module.exports = function () {

};
module.exports.prototype = AdminController.prototype.extend({
  name: 'users',

  indexAction: function() {
    var _this = this,
      findParams = _this.getFindParams(),
      filterParams = _this.getFilterParams(),
      sortParams = _this.getSortParams();

      _this.mongodb
        .collection('users')
        .find({$and: [filterParams, findParams]})
        .sort(sortParams)
        .toArray(function(err, users){
          _this.view.render({
            title: 'User Verwaltung - ToyBlocks',
            users: users
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
