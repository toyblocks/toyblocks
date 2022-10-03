'use strict';

var AdminController = require('../Admin'),
  attributeModel = require('../../models/Attribute');

module.exports = function () {

};
module.exports.prototype = AdminController.prototype.extend({
  name: 'attributes',


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
      .toArray(function (err, attributes) {
        _this.mongodb
          .collection('object_types')
          .find({})
          .toArray(function (err, objectTypes) {
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
            if (err) console.warn(err.message);
            if (err && err.message.indexOf('E11000 ') !== -1) {
              // this _id was already inserted in the database
            }
            // TODO: error handler
            _this.response.redirect('..');
          });
    }
    else {
      // TODO: error handler
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
      .find({ name: _this.request.param('attribute') })
      .next(function (err, attribute) {
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
        { name: _this.request.param('attribute') },
        { $set: { values: _this.request.param('enums') } },
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
    if (!req.param('name') || !req.param('name').match(/^[a-z][a-z0-9_]*$/)) {
      return false;
    }

    attribute.name = req.param('name');

    // check for empty title
    if (!req.param('title').trim()) {
      return false;
    }

    attribute.title = req.param('title');
    attribute.is_enum = !!req.param('is_enum');

    // last check. iterate over all types
    var paramType = req.param('type'),
      types = attributeModel.getTypes();

    for (var typeIndex in types) {
      if (types[typeIndex].name === paramType) {
        if (paramType === 'objecttype') {
          attribute.object_type = req.param('objecttype');
        }
        attribute.type = paramType;
        return attribute;
      }
    }
    return false;
  },
});
