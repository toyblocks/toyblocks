'use strict';

var AdminController = require('../Admin'),
  attributeModel = require('../../models/Attribute');
//AttributesController = require('./Attributes');

module.exports = function () {

};
module.exports.prototype = AdminController.prototype.extend({
  name: 'objects',

  /**
  * display all objecttypes
  * 
  */
  indexAction: function () {
    var _this = this;

    // user didn't choose an object type. show a list
    this.mongodb
      .collection('object_types')
      .find({})
      .sort({ title: 1 })
      .toArray(function (_err, types) {
        _this.mongodb
          .collection(attributeModel.collection)
          .find({})
          .toArray(function (_err, attributes) {
            for (var typeIndex in types) {
              types[typeIndex].attributeNames = Object.keys(types[typeIndex].attributes);
            }
            _this.view.render({
              title: 'Objekte Verwaltung - ToyBlocks',
              types: types,
              attributes: attributes,
              attributeTypes: attributeModel.getTypes()
            });
          });
      });
  },

  /**
  * add a new type to the database
  *
  */
  createTypeAction: function () {
    var type = this.getTypeFromRequest();
    var _this = this;
    
    if (type) {
      _this.mongodb
        .collection('object_types')
        .insertOne(
          type,
          { w: 1 },
          function (err) {
            if (err && err.message.indexOf('E11000 ') !== -1) {
              // this _id was already inserted in the database
              console.warn(err.message);
              throw new Error('Fehler: ' + err);
            }

            // rewrite to set indeces
            if (type.randomized) {
              _this.mongodb
                .collection('object_types')
                .ensureIndex({ _random: '2d' }, function () {
                  _this.response.redirect('..');
                });
            }
            else {
              _this.response.redirect('..');
            }
          });
    }
  },

  getTypeFromRequest: function () {
    var type = {};
    var _this = this;
    var name = _this.request.paramNew('name');
    var title = _this.request.paramNew('title');
    var randomized = _this.request.paramNew('randomized');
    var attributes = _this.request.paramNew('attributes');

    // check for unallowed chars in attribute name
    if (!name || !name.match(/^[a-z][a-z0-9_]*$/))
      return false;
    type.name = name;

    if (!title.trim()) // check for empty title
      return false;
    type.title = title;

    type.randomized = !!randomized;

    var attrs = attributes;
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

  /**
  * show all objects for a specific type
  */
  objectsAction: function () {
    var _this = this;
    var countPerPage = 15;
    var onlyContent = _this.request.query.only_content || false;
    var findParams = _this.getFindParams();
    var type = _this.request.paramNew("type");

    // getting main type
    this.getTypeWithAttributes(
      type,
      function (type, attributes) {
        // prepare attributes index
        var attributesByName = {};
        for (var i = 0; i < attributes.length; i++) {
          attributes[i].props = type.attributes[attributes[i].name];
          attributesByName[attributes[i].name] = attributes[i];
        }

        _this.mongodb
          .collection(type.name)
          .find(findParams)
          .count(function (_err, totalCount) {
            // getting all objects for type
            _this.setPagination(totalCount, countPerPage);
            _this.mongodb
              .collection(type.name)
              .find(findParams)
              .skip(_this.getPaginationSkip())
              .limit(_this.getPaginationLimit())
              .toArray(function (_err2, objects) {
                // for remote calls we change the template
                if (_this.request.paramNew('_view') === 'selection') {
                  _this.view.setParam('onlyContent', onlyContent);
                  _this.view.setTemplate(_this.view.getTemplate() + '-remote');
                }
                for (var i = 0; i < objects.length; i++) {
                  objects[i]._objectid = objects[i]._id;
                }
                _this.view.render({
                  title: type.title + ' Verwaltung - ToyBlocks',
                  type: type,
                  attributes: attributes,
                  attributesByName: attributesByName,
                  objects: objects
                });
              });
          });
      });
  },

  /**
  *   Updates the active attribute of a db entry
  */
  changeactiveAction: function () {
    var _this = this;
    var id = _this.request.paramNew('id');
    var objectId = _this.mongo.ObjectID(id);
    var dbtype = _this.request.paramNew('type');
    var value = _this.request.paramNew('value') === 'true' ? true : false;

    _this.mongodb
      .collection(dbtype)
      .updateOne({ _id: objectId },
        { $set: { 'active': value } },
        {},
        function (err) {
          if (err)
            _this.response.json({ result: 'error' });
          else
            _this.response.json({ result: 'success' });
        });
  },

  deleteObjectAction: function (redirection) {
    var _this = this;
    var id = _this.request.paramNew('id');
    var objectId = this.mongo.ObjectID(id);
    var search = _this.request.paramNew('search');

    // getting main type
    this.getTypeWithAttributes(
      _this.request.query.type,
      function (type, attributes) {

        // set redirect path to optional parameter or default value
        var redirectPath = redirection || '../objects?type=' + type.name + '&search=' + search;

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
            .find({ _id: objectId })
            .next(function (_err, object) {
              // receive & delete images
              var imageIds = [];
              for (var i = 0; i < imageAttributes.length; i++) {
                if (object[imageAttributes[i]])
                  imageIds = imageIds.concat(object[imageAttributes[i]]);
              }

              _this.mongodb.collection('images').deleteOne({ _id: { $in: imageIds } }, {}, function () {
                _this.mongodb.collection(type.name).deleteOne({ _id: objectId }, {}, function () {
                  _this.response.redirect(redirectPath);
                });
              });
            });
        }
        else {
          _this.mongodb.collection(type.name).deleteOne({ _id: objectId }, {}, function () {
            _this.response.redirect(redirectPath);
          });
        }
        _this.updateLastModifiedTimestamp();
      });
  },

  upsertObjectAction: function (redirection) {
    var _this = this;
    let type = _this.request.paramNew('type');
    let id = _this.request.paramNew('id');

    // getting main type
    _this.getTypeWithAttributes(
      type,
      function (type, attributes) {

        // set redirect path to optional parameter or default value
        var redirectPath = redirection || '../objects?type=' + type.name;

        console.log("redirectPath", redirection, redirectPath);

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

        // check if we update an excisting object or creating a new one
        if (id !== "" && id !== undefined) {
          object._id = _this.mongo.ObjectID(id);
        }

        // iterate through all attributes and prepare them for saving
        for (var i = 0; i < attributes.length; i++) {
          reqValue = _this.request.paramNew(attributes[i].name);
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
                  imageValues.push({ attr: attributeName, index: images.length });
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
          .insertMany(images, { keepGoing: true }, function (_err, result) {
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
                  object[imageValues[i].attr] = result.insertedIds[imageValues[i].index];
                }
              }
            }

            // if updating an object, we should delete unused pictures
            if (object._id) {
              _this.mongodb
                .collection(type.name)
                .find({ _id: object._id })
                .next(function (_err, oldObject) {
                  var deleteImages = [];
                  for (var i = 0; i < attributes.length; i++) {
                    if (attributes[i].type === 'image') {
                      var value = oldObject[[attributes[i].name]];
                      if (type.attributes[attributes[i].name].multiple) {
                        for (var valIndex in value) {
                          if (!usedImages['' + value[valIndex]]) {
                            deleteImages.push(value[valIndex]);
                          }
                        }
                      }
                      else {
                        if (!usedImages['' + value]) {
                          deleteImages.push(value);
                        }
                      }
                    }
                  }
                  _this.mongodb
                    .collection('images')
                    .deleteOne({ _id: { $in: deleteImages } }, {}, function () {
                      // finally update object in db
                      _this.mongodb
                        .collection(type.name)
                        .updateOne({ _id: object._id }, { $set: object }, {}, function (err) {
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
                .insertOne(object, {}, function (err) {
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
    let type = _this.request.paramNew('type');
    let id = _this.request.paramNew('id');

    if (!type) {
      throw new Error('Param "type" is needed.');
    }

    _this.getTypeWithAttributes(type,
      function (type, attributes) {
        if (id) {
          _this.mongodb
            .collection(type.name)
            .find({ _id: _this.mongo.ObjectID(id) })
            .next(function (_err, object) {
              _this.view.render({
                title: type.title + ' bearbeiten - ToyBlocks',
                type: type,
                attributes: attributes,
                object: object
              });
            });
        }
        else {
          _this.view.render({
            title: type.title + ' erstellen - ToyBlocks',
            type: type,
            attributes: attributes
          });
        }
      });
  },

  referencesAction: function () {
    var _this = this;
    var typeName = _this.request.paramNew('type');
    var ids = _this.request.paramNew('ids').split(',');

    for (var i in ids) {
      if (ids[i]) {
        ids[i] = _this.mongo.ObjectID(ids[i]);
      }
    }
    _this.mongodb
      .collection(typeName)
      .find({ _id: { $in: ids } }, { title: true, image: true })
      .toArray(function (err, objects) {
        if (!err) {
          _this.view.render({
            objects: objects
          });
        }
      });

  },

  getTypeWithAttributes: function (typeName, callback) {
    var _this = this;

    if (!typeName) {
      throw new Error('Param "typeName" is needed.');
    }

    _this.mongodb
      .collection('object_types')
      .find({ name: typeName })
      .next(
        function (err, type) {
          if (err)
            throw new Error(err);
          else {
            type.attributeNames = Object.keys(type.attributes);
            // getting attributes
            _this.mongodb
              .collection(attributeModel.collection)
              .find({ name: { $in: type.attributeNames } })
              .toArray(function (err, attributes) {
                if (err)
                  throw new Error(err);
                else {
                  for (var i = 0; i < attributes.length; i++) {
                    attributes[i].props = type.attributes[attributes[i].name];
                  }
                  callback(type, attributes);
                }
              });
          }
        });
  },

  getRightLevel: function () {
    var type = this.request.paramNew('type');
    var modTypes = [
      'assemble_games',
      'assemble_images',
      'encyclopedia_articles',
      'missingparts_games',
      'missingparts_images',
      'multiplechoice_games',
      'multiplechoice_questions',
      'sorting_buildings',
      'sorting_games'
    ];

    if (type && modTypes.indexOf(type) >= 0) {
      return 200;
    }
    else {
      return 100;
    }
  }


});
