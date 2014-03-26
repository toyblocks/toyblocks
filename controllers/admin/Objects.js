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
    var _this = this,
      countPerPage = 10,
      findParams = _this.getFindParams();

    // getting main type
    this.getTypeWithAttributes(
      this.request.param('type'),
      function(type, attributes) {
        // prepare attributes index
        var attributesByName = {};
        for (var i = 0; i < attributes.length; i++) {
          attributes[i].props = type.attributes[attributes[i].name];
          attributesByName[attributes[i].name] = attributes[i];
        }

        _this.mongodb
          .collection(type.name)
          .count(function(err, totalCount) {
            // getting all objects for type
            _this.setPagination(totalCount, countPerPage);
            _this.mongodb
              .collection(type.name)
              .find(findParams)
              .skip(_this.getPaginationSkip())
              .limit(_this.getPaginationLimit())
              .toArray(function(err, objects) {
                // for remote calls we change the template
                if (_this.request.param('_view') === 'selection') {
                  if (_this.request.param('only_content') &&
                    _this.request.param('only_content') === '1') {
                    _this.view.setParam('onlyContent', true);
                  }
                  else {
                    _this.view.setParam('onlyContent', false);
                  }
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
            });
      });
  },

  deleteObjectAction: function (redirection) {
    var _this = this,
      objectId = this.mongo.ObjectID(this.request.param('id'));

    // getting main type
    this.getTypeWithAttributes(
      this.request.param('type'),
      function(type, attributes) {

        // set redirect path to optional parameter or default value
        var redirectPath = redirection || '../objects?type=' + type.name;

        //here we collect all attributes, which are of the image type
        var imageAttributes = [];
        for (var i = 0; i < attributes.length; i++) {
          if (attributes[i].type === 'image')
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
                  _this.response.redirect(redirectPath);
                });
              });
            });
        }
        else {
          _this.mongodb.collection(type.name).remove({_id: objectId}, {}, function() {
            _this.response.redirect(redirectPath);
          });
        }
        
        _this.updateLastModifiedTimestamp();

      });


  },

  upsertObjectAction: function (redirection) {
    var _this = this;

    // getting main type
    _this.getTypeWithAttributes(
      _this.request.param('type'),
      function(type, attributes) {

        // set redirect path to optional parameter or default value
        var redirectPath = redirection || '../objects?type=' + type.name;

        // prepare attributes index
        var object = {},
          images = [],
          usedImages = {},
          reqValue,
          typeProps,
          attributeName,
          imageValues = [];

        // for randomized object types we define a random number
        if (type.randomized) {
          object._random = [Math.random(), 0];
        }

        if (_this.request.param('id')) {
          object._id = _this.mongo.ObjectID(_this.request.param('id'));
        }

        // iterate through all attributes and prepare them for saving
        for (var i = 0; i < attributes.length; i++) {
          reqValue = _this.request.param('values')[attributes[i].name];
          typeProps = type.attributes[attributes[i].name];
          attributeName = attributes[i].name;

          // validate and transform to values for the db
          object[attributeName] = attributeModel.validateAndTransform(
            attributes[i],
            typeProps,
            reqValue,
            _this.mongo,
            _this.request);

          if (object[attributeName] === null)
            continue;

          // if attribute type is image, prepare images for saving
          if (attributes[i].type === 'image') {
            if (typeProps.multiple) {
              imageValues.push(object[attributeName]);
              for (var j in object[attributeName]) {
                if (typeof object[attributeName][j] === 'object') {
                  if (!(object[attributeName][j] instanceof _this.mongo.ObjectID)) {
                    object[attributeName][j].index = images.length;
                    images.push({
                      type: object[attributeName][j].ext,
                      data: _this.request
                        .mongo.Binary(object[attributeName][j].buffer)
                    });
                  }
                  else {
                    usedImages['' + object[attributeName][j]] = true;
                  }
                }
              }
            }
            else {
              if (typeof object[attributeName] === 'object') {
                if (!(object[attributeName] instanceof _this.mongo.ObjectID)) {
                  imageValues.push({attr: attributeName, index: images.length});
                  images.push({
                    type: object[attributeName].ext,
                    data: _this.request.mongo.Binary(object[attributeName].buffer)
                  });
                }
                else {
                  usedImages['' + object[attributeName]] = true;
                }
              }
            }
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
                  if (typeof imageValues[i][j] === 'object' &&
                    !(imageValues[i][j] instanceof _this.mongo.ObjectID)) {
                    imageValues[i][j] = result[imageValues[i][j].index]._id;
                  }
                }
              }
              else {
                if (typeof imageValues[i] === 'object' &&
                  !(imageValues[i] instanceof _this.mongo.ObjectID)) {
                  object[imageValues[i].attr] = result[imageValues[i].index]._id;
                }
              }
            }

            // if updating an object, we should delete unused pictures
            if (object._id) {
              _this.mongodb
                .collection(type.name)
                .find({_id: object._id})
                .nextObject(function(err, oldObject) {
                  var deleteImages = [];
                  for (var i = 0; i < attributes.length; i++) {
                    if (attributes[i].type === 'image') {
                      var value = oldObject[[attributes[i].name]];
                      if (type.attributes[attributes[i].name].multiple) {
                        for (var valIndex in value) {
                          if (!usedImages[''+value[valIndex]]) {
                            deleteImages.push(value[valIndex]);
                          }
                        }
                      }
                      else {
                        if (!usedImages[''+value]) {
                          deleteImages.push(value);
                        }
                      }
                    }
                  }
                  _this.mongodb
                    .collection('images')
                    .remove({_id: {$in: deleteImages}}, {}, function() {
                      // finally update object in db
                      _this.mongodb
                        .collection(type.name)
                        .update({_id: object._id}, object, {}, function(err, result) {
                          if (err) throw new Error(err);
                          _this.response.redirect(redirectPath);
                        });
                    });
                });
            }
            else {
              // inserting object into db
              _this.mongodb
                .collection(type.name)
                .insert(object, {}, function(err, result) {
                  if (err) throw new Error(err);
                  _this.response.redirect(redirectPath);
                });
            }

            _this.updateLastModifiedTimestamp();

          });

      });

  },

  formAction: function () {
    var _this = this;
    if (!_this.request.param('type')) {
      throw new Error('Param "type" is needed.');
    }

    _this.getTypeWithAttributes(_this.request.param('type'),
      function (type, attributes) {
        if (_this.request.param('id')) {
          _this.mongodb
            .collection(type.name)
            .find({_id: _this.mongo.ObjectID(_this.request.param('id'))})
            .nextObject(function(err, object) {
              _this.view.render({
                title: type.title + ' bearbeiten',
                type: type,
                attributes: attributes,
                object: object
              });
            });
        }
        else {
          _this.view.render({
            title: type.title + ' erstellen',
            type: type,
            attributes: attributes
          });
        }
      });
  },

  referencesAction: function () {
    var _this = this,
      typeName = _this.request.param('type'),
      ids = _this.request.param('ids').split(','),
      i;

    for (i in ids) {
      if (ids[i]) {
        ids[i] = _this.mongo.ObjectID(ids[i]);
      }
    }
    _this.mongodb
      .collection(typeName)
      .find({_id: {$in: ids}}, {title: true, image: true})
      .toArray(function(err, objects) {
        if (!err) {
          _this.view.render({
            objects: objects
          });
        }
      });

  },

  getTypeWithAttributes: function (typeName, cb) {
    var _this = this;
    _this.mongodb
      .collection('object_types')
      .find({name: typeName})
      .nextObject(
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
                if (err)
                  throw new Error(err);
                else {
                  for (var i = 0; i < attributes.length; i++) {
                    attributes[i].props = type.attributes[attributes[i].name];
                  }
                  cb(type, attributes);
                }
              });
          }
        });
  },

  getRightLevel: function () {
    var type = this.request.param('type'),
      modTypes = ['missingparts_games', 'assemble_images', 'assemble_games',
        'missingparts_images', 'multiplechoice_questions',
        'multiplechoice_games', 'encyclopedia_articles',
        'sorting_buildings', 'sorting_games'];

    if (type && modTypes.indexOf(type) >= 0) {
      return 200;
    }
    else {
      return 100;
    }
  }


});
