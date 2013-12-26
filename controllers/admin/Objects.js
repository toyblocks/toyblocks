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

  createObjectAction: function () {
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
                object[attributeName] = attributeModel.validateAndTransform(
                  attributes[i],
                  typeProps,
                  reqValue);
                // prepare images for saving
                if (attributes[i].type === 'image') {
                  imageValues.push(object[attributeName]);
                  if (typeProps.multiple) {
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
                      object[attributeName].index = images.length;
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
                    if (typeof imageValues[i] === 'object')
                      imageValues[i] = result[imageValues[i].index]._id;
                  }
                }

                _this.mongodb
                  .collection(type.name)
                  .insert(object, {}, function(err, result) {
                    if (err) throw new Error(err);
                    _this.response.redirect('..?type='+type.name);
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
