var BaseController = require('../Base');

module.exports = function () {
};
module.exports.prototype = BaseController.prototype.extend({
  area: 'index',
  name: 'ressource',

  indexAction: function() {
    var _this = this;
    if (this.request.param('id')) {
      this.mongodb
        .collection('pictures')
        .find({_id: this.mongo.ObjectID(this.request.param('id'))})
        .nextObject(function(err, doc) {
          if (doc) {
            _this.response.type('image/' + doc.type);
            _this.response.send(doc.data.value(true));
          }
          else {
            _this.response.send(404, 'Image not found');
          }
        });
    }
  }
});

