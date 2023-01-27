'use strict';

var AdminController = require('../Admin'),
  attributeModel = require('../../models/Attribute');

module.exports = function () {

};
module.exports.prototype = AdminController.prototype.extend({
  name: 'attributes',
  rightLevel: 100,


  /**
  * Returns access right level
  * 
  */
  getRightLevel: function () {
    if (this.action === 'show-enums' || this.action === 'save-enums') {
      return 100;
    }
    return this.rightLevel;
  },


  /**
  * Renders Index page
  * 
  */
  indexAction: function () {
    var _this = this;
    _this.mongodb
      .collection(attributeModel.collection)
      .find({})
      .toArray(function (_err, attributes) {
        _this.mongodb
          .collection('object_types')
          .find({})
          .toArray(function (_err, objectTypes) {
            _this.view.render({
              title: 'Attribute Verwaltung - ToyBlocks',
              attributes: attributes,
              attributeTypes: attributeModel.getTypes(),
              objectTypes: objectTypes
            });
          });
      });
  },


  /**
  * Creates new object in DB
  * 
  */
  createAction: function () {
    var _this = this,
      attribute = this.getAttributeFromRequest();
    if (attribute) {
      this.mongodb
        .collection(attributeModel.collection)
        .insertOne(
          attribute,
          { w: 1 },
          function (err) {
            if (err) {
              // this _id was already inserted in the database
              console.warn(err.message);
              throw new Error('' + err);
            }
            _this.response.redirect('..');
          });
    }
    else {
      this.response.redirect('..');
      throw new Error('attribute not found');
    }
  },


  /**
  * Shows Enums
  * 
  */
  showEnumsAction: function () {
    var _this = this;
    _this.mongodb
      .collection(attributeModel.collection)
      .find({ name: _this.request.paramNew('attribute') })
      .next(function (_err, attribute) {
        _this.view.render({ attribute: attribute });
      });
  },


  /**
  * Saves Enums
  * 
  */
  saveEnumsAction: function (context) {
    var _this = context || this;
    _this.mongodb
      .collection(attributeModel.collection)
      .updateOne(
        { name: _this.request.paramNew('attribute') },
        { $set: { values: _this.request.paramNew('enums') } },
        {},
        function (err) {
          var msg = err ? 'error' : 'success';
          _this.response.json({ result: msg });
        });
  },


  /**
  * Extracts attributes from the request
  * 
  */
  getAttributeFromRequest: function () {
    var req = this.request,
      attribute = {};

    // check for unallowed chars in attribute name
    if (!req.paramNew('name') || !req.paramNew('name').match(/^[a-z][a-z0-9_]*$/)) {
      return false;
    }

    attribute.name = req.paramNew('name');

    // check for empty title
    if (!req.paramNew('title').trim()) {
      return false;
    }

    attribute.title = req.paramNew('title');
    attribute.is_enum = !!req.paramNew('is_enum');

    // last check. iterate over all types
    var paramType = req.paramNew('type'),
      types = attributeModel.getTypes();

    for (var typeIndex in types) {
      if (types[typeIndex].name === paramType) {
        if (paramType === 'objecttype') {
          attribute.object_type = req.paramNew('objecttype');
        }
        attribute.type = paramType;
        return attribute;
      }
    }
    return false;
  },
});
