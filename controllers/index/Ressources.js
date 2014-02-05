'use strict';

var BaseController = require('../Base'),
  gm = require('gm');

module.exports = function () {
};
module.exports.prototype = BaseController.prototype.extend({
  area: 'index',
  name: 'ressources',

  imageAction: function() {
    var _this = this;
    if (_this.request.param('id')) {
      // if comma seperated ids are given, take random pic from it
      var picIds = _this.request.param('id').split(','),
        picId = picIds[Math.floor(Math.random()*picIds.length)],
        size = _this.request.param('size');

      if (size !== 'middle' && size !== 'large') {
        size = '';
      }
      else {
        size = '_' + size;
      }

      var notFoundFunc = function() {
        _this.response.send(404, 'Image not found');
      },

      showImageFunc = function(type, buffer) {
        _this.response.type('image/' + type);
        _this.response.send(buffer);
      },

      resizeAndShowImageFunc = function(picId) {
        _this.mongodb
          .collection('images')
          .find({_id: _this.mongo.ObjectID(picId)})
          .nextObject(function(err, doc) {
            // getting original image
            if (doc) {
              var width,
                pic = gm(doc.data.read(0,doc.data.length()));

              // predefined widths for sizes
              if (size === '_middle') width = 200;
              else if (size === '_large') width = 1024;

              // resize and get buffer
              pic.resize(width).size(function(err, picSize) {
                pic.toBuffer(function (err, buffer) {
                  if (err) {
                    notFoundFunc();
                  }
                  else {
                    doc.data = _this.request.mongo.Binary(buffer);
                    doc.width = picSize.width;
                    doc.height = picSize.height;
                    // write new image into mongodb
                    _this.mongodb
                      .collection('images' + size)
                      .insert(doc, {}, function(err, newDoc) {

                      });
                    showImageFunc(doc.type, buffer);
                    //_this.response.type('image/' + doc.type);
                    //_this.response.send(buffer);
                  }
                });
              });
            }
            else {
              notFoundFunc();
            }
          });
      };

      // find resized image
      _this.mongodb
        .collection('images' + size)
        .find({_id: _this.mongo.ObjectID(picId)})
        .nextObject(function(err, doc) {
          if (doc) {
            // if found render
            showImageFunc(doc.type, doc.data.value(true));
          }
          else {
            if (size) {
              // else we have to resize and save the image
              resizeAndShowImageFunc(picId);
            }
            else {
              notFoundFunc();
            }
          }
        });
    }
    else {
      _this.response.send(404, 'wrong parameter');
    }
  }
});


/*
var pic = gm(doc.data.read(0,doc.data.length()));
pic.size(function(err, size){
  pic.format(function(err, format){
    console.log(size, format);
  });
});
*/

