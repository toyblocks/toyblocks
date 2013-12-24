var AdminController = require('../Admin');
  //AttributesController = require('./Attributes');

module.exports = function () {
  
};
module.exports.prototype = AdminController.prototype.extend({
  name: 'objects',

  indexAction: function() {
    var attributes = [],
      _this = this;

    // user didn't choose an object type. show a list
    if (!this.request.params.type) {
      this.mongodb
        .collection('object-types')
        .find({})
        .toArray(function(err, types){
          _this.view.render({
            title: 'Objekte Verwaltung',
            types: types
          });
        });
      // TODO: object type form
    }
    // show objects with specified type
    else {
      this.getType(this.request.params.type,
        function(err, type) {
          if (err)
            throw new Error(err);
          else {
            this.mongodb
              .collection(type.name)
              .find({})
              // TODO: implement skip and limit
              .toArray(function(err, objects) {
                _this.view.render({
                  title: type.title + ' Verwaltung',
                  type: type,
                  objects: objects
                });
              });
              // TODO: generate object form
          }
        });
    }
  },

  getType: function (typeName, cb) {
    this.mongodb
      .collection('object-types')
      .find({name: typeName})
      .nextObject(cb);
  }


});
