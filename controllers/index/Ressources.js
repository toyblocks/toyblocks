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
      this.mongodb
        .collection('images')
        .find({_id: this.mongo.ObjectID(this.request.param('id'))})
        .nextObject(function(err, doc) {
          if (doc) {
            _this.response.type('image/' + doc.type);
            _this.response.send(doc.data.value(true));
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
  }
});

