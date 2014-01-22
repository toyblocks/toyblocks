var BaseController = require('../Base'),
  gm = require('gm');

module.exports = function () {
};
module.exports.prototype = BaseController.prototype.extend({
  area: 'index',
  name: 'ressources',

  imageAction: function() {
    var _this = this;
    if (this.request.param('id')) {
      // if comma seperated ids are given, take random pic from it
      var picIds = this.request.param('id').split(','),
        picId = picIds[Math.floor(Math.random()*picIds.length)];
      this.mongodb
        .collection('images')
        .find({_id: this.mongo.ObjectID(picId)})
        .nextObject(function(err, doc) {
          if (doc) {

            _this.response.type('image/' + doc.type);

            var width = _this.request.param('width');
            if (width) {
              var pic = gm(doc.data.read(0,doc.data.length()));
              pic.resize(width).toBuffer(function (err, buffer) {
                if (err)
                  _this.response.send(404, 'Image not found');
                _this.response.send(buffer);
              });
            }
            else {
              _this.response.send(doc.data.value(true));
            }
            /*
            var pic = gm(doc.data.read(0,doc.data.length()));
            pic.size(function(err, size){
              pic.format(function(err, format){
                console.log(size, format);
              });
            });
            */
          }
          else {
            _this.response.send(404, 'Image not found');
          }
        });
    }
    else {
      _this.response.send(404, 'Image not found');
    }
  }
});

