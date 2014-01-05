var BaseModel = require('./Base'),
	base = new BaseModel();

module.exports = base.extend({
  collection: 'attributes',

  getTypes: function () {
    var types = [
      {name: 'string', explain: 'Einfacher Text'},
      {name: 'text', explain: 'Beschreibungs Text'},
      {name: 'date', explain: 'Einfaches Datum'},
      {name: 'datetime', explain: 'Datum mit Zeit'},
      {name: 'int', explain: 'Strikte Zahl'},
      {name: 'float', explain: 'Strikte Kommazahl'},
      {name: 'image', explain: 'Bild'},
      {name: 'attributes', explain: 'Liste von Attributen'},
      {name: 'objecttype', explain: 'Verweise zu Objekten vom Typ'},
      {name: 'random', explain: 'Zufallszahl für zufällige Objekte'},
    ];
    return types;
  },

  validateAndTransform: function (attribute, typeProps, value) {
    if (typeProps.multiple) {
      for (var valIndex in value) {
        value[valIndex] = this._validateAndTransformOne(attribute, typeProps, value[valIndex]);
      }
    }
    else {
      value = this._validateAndTransformOne(attribute, typeProps, value);
    }
    return value;
  },

  _validateAndTransformOne: function (attribute, typeProps, value) {
    value = value.trim();
    if (typeProps.mandatory && !value)
      throw new Error('please fill out ' + attribute.name);
    switch (attribute.type) {
    case 'string':
      return '' + value;

    case 'int':
      if (!value.match(/^[\d]*$/))
        throw new Error('value is not a valid number');
      if (!value)
        return null;
      else
        return parseInt(value, 10);

    case 'image':
      if (value.substr(0, 6) === 'saved:')
        return value.substr(6);
      var basePos = value.search(/base64,/);
      if (!basePos)
        throw new Error('image is not valid');

      var matches = value.slice(0,basePos).match(/^data:.+\/(.+);$/),
        ext = matches[1],
        buffer = new Buffer(value.slice(basePos+7), 'base64');
      return {ext: ext, buffer: buffer};
    }
  }

});
