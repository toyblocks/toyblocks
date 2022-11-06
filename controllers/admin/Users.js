'use strict';

var AdminController = require('../Admin');

module.exports = function () {

};
module.exports.prototype = AdminController.prototype.extend({
  name: 'users',

  indexAction: function () {
    var _this = this,
      findParams = _this.getFindParams(),
      filterParams = _this.getFilterParams(),
      sortParams = _this.getSortParams();

    _this.mongodb
      .collection('users')
      .find({ $and: [filterParams, findParams] })
      .sort(sortParams)
      .toArray(function (_err, users) {
        _this.view.render({
          title: 'User Verwaltung - ToyBlocks',
          users: users
        });
      });

  },

  updateAction: function () {
    var _this = this;
    var id = _this.request.body['tuid'];
    var rightlevel = parseInt(_this.request.body['right_level']);
    if(id === undefined || id === "undefined")
      _this.response.json({ result: 'error' });
    
    _this.mongodb
      .collection('users')
      .updateOne(
        { tuid: id },
        { $set: { 'right_level': rightlevel } },
        {},
        function (err) {
          if (err)
            _this.response.json({ result: 'error' });
          else
            _this.response.json({ result: 'success' });
        });
  },

  deleteAction: function () {
    var _this = this;
    var id = _this.request.body['id'];
    _this.mongodb
      .collection('users')
      .deleteOne({ _id: _this.mongo.ObjectID(id) }, 1, function (err) {
        if (err) {
          _this.response.json({ result: 'error' });
        }
        else {
          _this.response.json({ result: 'success' });
        }
      });
  },


  deleteallusersAction: function () {
    var _this = this;

    _this.mongodb
      .collection('users')
      .deleteOne({ student: true, right_level: 300 }, 0, function (err) {
        if (err)
          _this.response.json({ result: 'error' });
        else
          _this.response.json({ result: 'success' });
      });
  }

});
