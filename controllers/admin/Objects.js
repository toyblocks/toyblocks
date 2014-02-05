'use strict';

var AdminController = require('../Admin'),
  attributeModel = require('../../models/Attribute');
  //AttributesController = require('./Attributes');

module.exports = function () {

};
module.exports.prototype = AdminController.prototype.extend({
  name: 'objects',

  // display all objecttypes
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

  // add a new type to the database
  createTypeAction: function() {
    var type = this.getTypeFromRequest(),
      _this = this;
    if (type) {
      _this.mongodb
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

            // rewrite to set indeces
            if (type.randomized) {
              _this.mongodb
                .collection('object_types')
                .ensureIndex({_random: '2d'}, function(){
                  _this.response.redirect('..');
                });
            }
            else {
              _this.response.redirect('..');
            }
          });
    }
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

    type.randomized = !!req.param('randomized');

    var attrs = req.param('attributes');
    type.attributes = {};
    for (var i in attrs) {
      var attr = {};
      attr.mandatory = !!attrs[i].mandatory;
      attr.multiple = !!attrs[i].multiple;
      attr.display = !!attrs[i].display;
      type.attributes[attrs[i].name] = attr;
    }
    return type;
  },

  // show all objects for a specific type
  objectsAction: function () {
    var _this = this;

    // getting main type
    this.getType(
      this.request.param('type'),
      function(err, type) {
        if (err)
          throw new Error(err);
        else {
          type.attributeNames = Object.keys(type.attributes);
          // getting attributes
          _this.mongodb
          .collection(attributeModel.collection)
          .find({name: {$in: type.attributeNames}})
          .toArray(function(err, attributes) {
            // prepare attributes index
            var attributesByName = {};
            for (var i = 0; i < attributes.length; i++) {
              attributes[i].props = type.attributes[attributes[i].name];
              attributesByName[attributes[i].name] = attributes[i];
            }
            // getting all objects for type
            _this.mongodb
              .collection(type.name)
              .find({})
              // TODO: implement skip and limit
              .toArray(function(err, objects) {
                if (_this.request.xhr) {
                  _this.view.setTemplate(_this.view.getTemplate() + '-remote');
                }
                _this.view.render({
                  title: type.title + ' Verwaltung',
                  type: type,
                  attributes: attributes,
                  attributesByName: attributesByName,
                  objects: objects
                });
              });
              // TODO: generate object form
          });
        }
      });
  },

  deleteObjectAction: function () {
    var _this = this,
      objectId = this.mongo.ObjectID(this.request.param('id'));

    // getting main type
    this.getType(
      this.request.param('type'),
      function(err, type) {
        if (err)
          throw new Error(err);
        else {
          type.attributeNames = Object.keys(type.attributes);
          // getting attributes
          _this.mongodb
          .collection(attributeModel.collection)
          .find({name: {$in: type.attributeNames}})
          .toArray(function(err, attributes) {

            //here we collect all attributes, which are of the image type
            var imageAttributes = [];
            for (var i = 0; i < attributes.length; i++) {
              if (attributes[i].type == 'image')
                imageAttributes.push(attributes[i].name);
            }

            // check if we have images to delete
            if (imageAttributes.length > 0) {
              _this.mongodb
                .collection(type.name)
                .find({_id: objectId})
                .nextObject(function(err, object){
                  // receive & delete images
                  var imageIds = [];
                  for (var i = 0; i < imageAttributes.length; i++) {
                    if (object[imageAttributes[i]])
                      imageIds = imageIds.concat(object[imageAttributes[i]]);
                  }

                  _this.mongodb.collection('images').remove({_id: {$in: imageIds}}, {}, function () {
                    _this.mongodb.collection(type.name).remove({_id: objectId}, {}, function() {
                      _this.response.redirect('../objects?type='+type.name);
                    });
                  });
                });
            }
            else {
              _this.mongodb.collection(type.name).remove({_id: objectId}, {}, function() {
                _this.response.redirect('../objects?type='+type.name);
              });
            }
          });
        }
      }
    );


  },

  createObjectAction: function () {
    var _this = this;

    // getting main type
    _this.getType(
      _this.request.param('type'),
      function(err, type) {
        if (err)
          throw new Error(err);
        else {
          type.attributeNames = Object.keys(type.attributes);
          // getting attributes
          _this.mongodb
          .collection(attributeModel.collection)
          .find({name: {$in: type.attributeNames}})
          .toArray(function(err, attributes) {
            // prepare attributes index
            var object = {},
              images = [],
              reqValue,
              typeProps,
              attributeName,
              imageValues = [];
            for (var i = 0; i < attributes.length; i++) {
              reqValue = _this.request.param('values')[attributes[i].name];
              typeProps = type.attributes[attributes[i].name];
              attributeName = attributes[i].name;

              try {
                if (type.randomized) {
                  object._random = [Math.random(), 0];
                }

                object[attributeName] = attributeModel.validateAndTransform(
                  attributes[i],
                  typeProps,
                  reqValue,
                  _this.mongo);
                // prepare images for saving
                if (attributes[i].type === 'image') {
                  if (typeProps.multiple) {
                    imageValues.push(object[attributeName]);
                    for (var j in object[attributeName]) {
                      if (typeof object[attributeName][j] === 'object') {
                        object[attributeName][j].index = images.length;
                        images.push({
                          type: object[attributeName][j].ext,
                          data: _this.request.mongo.Binary(object[attributeName][j].buffer)
                        });
                      }
                    }
                  }
                  else {
                    if (typeof object[attributeName] === 'object') {
                      imageValues.push({attr: attributeName, index: images.length});
                      images.push({
                        type: object[attributeName].ext,
                        data: _this.request.mongo.Binary(object[attributeName].buffer)
                      });
                    }
                  }
                }
              }
              catch (e) {
                throw new Error('validation exception');
              }
            }

            // save all images in bulk
            _this.mongodb
              .collection('images')
              .insert(images, {keepGoing:true}, function (err, result) {
                // set image ids in object
                for (var i in imageValues) {
                  if (Array.isArray(imageValues[i])) {
                    for (var j in imageValues[i]) {
                      if (typeof imageValues[i][j] === 'object')
                        imageValues[i][j] = result[imageValues[i][j].index]._id;
                    }
                  }
                  else {
                    if (typeof imageValues[i] === 'object') {
                      object[imageValues[i].attr] = result[imageValues[i].index]._id;
                    }
                  }
                }

                // insert object into database
                _this.mongodb
                  .collection(type.name)
                  .insert(object, {}, function(err, result) {
                    if (err) throw new Error(err);
                    _this.response.redirect('../objects?type='+type.name);
                  });
              });
          });
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
