var AdminController = require('../Admin');

module.exports = function () {
  
};
module.exports.prototype = AdminController.prototype.extend({
  name: 'attributes',

  indexAction: function() {
    var attributes = [],
      _this = this;
    this.mongodb
      .collection('attributes')
      .find({})
      .toArray(function(err, attributes){
        _this.view.render({
          title: 'Attribute Verwaltung',
          attributes: attributes,
          attributeTypes: _this.getTypes()
        });
      });
  },

  createAction: function() {
    var _this = this,
      attribute = this.getAttributeFromRequest();
    if (attribute) {
      this.mongodb
        .collection('attributes')
        .insert(
          attribute,
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
    else {
      throw new Error('fuck');
      // TODO: error handler
      this.response.redirect('..');
    }
  },

  getAttributeFromRequest: function() {
    var req = this.request,
      attribute = {};
    // check for unallowed chars in attribute name
    if (!req.param('name') || !req.param('name').match(/^[a-z][a-z0-9_]*$/))
      return false;
    attribute.name = req.param('name');
    console.log(attribute);

    if (!req.param('title').trim()) // check for empty title
      return false;
    attribute.title = req.param('title');
    console.log(attribute);

    attribute.is_enum = !!req.param('is_enum');

    // last check. iterate over all types
    var paramType = req.param('type'),
      types = this.getTypes();
    for (var typeIndex in types) {
      if (types[typeIndex].name === paramType) {
        // TODO: check for enum
        attribute.type = paramType;
        return attribute;
      }
    }
    return false;
  },

  getTypes: function() {
    var types = [
      {name: 'string', explain: 'Einfacher Text'},
      {name: 'date', explain: 'Einfaches Datum'},
      {name: 'datetime', explain: 'Datum mit Zeit'},
      {name: 'int', explain: 'Strikte Zahl'},
      {name: 'float', explain: 'Strikte Kommazahl'},
      {name: 'attributes', explain: 'Liste von Attributen'},
      {name: 'objecttype', explain: 'Verweise zu Objekten vom Typ'},
    ];
    return types;
  }
});
