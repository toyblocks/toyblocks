var AdminController = require('../Admin'),
  attributeModel = require('../../models/Attribute');
  //AttributesController = require('./Attributes');

module.exports = function () {
  
};
module.exports.prototype = AdminController.prototype.extend({
  name: 'objects',

  indexAction: function() {
    var _this = this;

    // user didn't choose an object type. show a list
    this.mongodb
      .collection('object_types')
      .find({})
      .toArray(function(err, types){
        _this.mongodb
          .collection(attributeModel.collection)
          .find({})
          .toArray(function(err, attributes) {
            for (var typeIndex in types) {
              types[typeIndex].attributeNames = Object.keys(types[typeIndex].attributes);
            }
            _this.view.render({
              title: 'Objekte Verwaltung',
              types: types,
              attributes: attributes,
              attributeTypes: attributeModel.getTypes()
            });
          });
      });
    // TODO: object type form
  },

  createTypeAction: function() {
    var type = this.getTypeFromRequest(),
      _this = this;
    if (type) {
      this.mongodb
        .collection('object_types')
        .insert(
          type,
          {w:1},
          function(err, objects) {
            if (err) console.warn(err.message);
            if (err && err.message.indexOf('E11000 ') !== -1) {
              // this _id was already inserted in the database
            }
            // TODO: error handler
            _this.response.redirect('..');
          });
    }
    throw new Error('test');
  },


  getTypeFromRequest: function() {
    var req = this.request,
      type = {};
    // check for unallowed chars in attribute name
    if (!req.param('name') || !req.param('name').match(/^[a-z][a-z0-9_]*$/))
      return false;
    type.name = req.param('name');

    if (!req.param('title').trim()) // check for empty title
      return false;
    type.title = req.param('title');

    var attrs = req.param('attributes');
    type.attributes = {};
    for (var i = 0; i < attrs.name.length; i++) {
      var attr = {};
      attr.mandatory = !!attrs.mandatory[i];
      attr.multiple = !!attrs.multiple[i];
      attr.display = !!attrs.display[i];
      type.attributes[attrs.name[i]] = attr;
    }
    return type;
  },


  objectsAction: function () {
    var _this = this;

    this.getType(this.request.params.type,
      function(err, type) {
        if (err)
          throw new Error(err);
        else {
          this.mongodb
            .collection(type.name)
            .find({})
            // TODO: implement skip and limit
            .toArray(function(err, objects) {
              _this.view.render({
                title: type.title + ' Verwaltung',
                type: type,
                objects: objects
              });
            });
            // TODO: generate object form
        }
      });
  },

  getType: function (typeName, cb) {
    this.mongodb
      .collection('object_types')
      .find({name: typeName})
      .nextObject(cb);
  }


});
