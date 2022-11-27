'use strict';

var BaseModel = require('./Base'),
  base = new BaseModel();

module.exports = base.extend({
  collection: 'attributes',

  getTypes: function () {
    var types = [
      { name: 'string', explain: 'Einfacher Text' },
      { name: 'text', explain: 'Beschreibungs Text' },
      { name: 'date', explain: 'Einfaches Datum' },
      { name: 'datetime', explain: 'Datum mit Zeit' },
      { name: 'int', explain: 'Strikte Zahl' },
      { name: 'bool', explain: 'Simples Ja/Nein' },
      { name: 'float', explain: 'Strikte Kommazahl' },
      { name: 'image', explain: 'Bild' },
      { name: 'attributes', explain: 'Liste von Attributen' },
      { name: 'objecttype', explain: 'Verweise zu Objekten vom Typ' },
      { name: 'random', explain: 'Zufallszahl für zufällige Objekte' },
    ];
    return types;
  },

  validateAndTransform: function (attribute, typeProps, value, mongo) {
    let result = [];
    if (typeProps.multiple) {
      if(!Array.isArray(value)){
        value = [value];
      }
      for (var valIndex in value) {
        // Filter items which are empty
        if(value[valIndex] === undefined || value[valIndex] === null || value[valIndex] === '')
          continue;
        result[valIndex] = this._validateAndTransformOne(attribute,
          typeProps, value[valIndex], mongo);
      }
    }
    else {
      result = this._validateAndTransformOne(attribute, typeProps, value, mongo);
    }
    return result;
  },

  _validateAndTransformOne: function (attribute, typeProps, value, mongo) {
    // console.log("_validateAndTransformOne", attribute, typeProps, (value + '').slice(0,50));
    if (typeof value === 'undefined')
      value = '';

    value = value.trim();

    if (typeProps.mandatory && !value){
      throw new Error('Bitte fülle das folgende Feld aus: ' + attribute.name);
    }

    switch (attribute.type) {
      case 'string':
      case 'text':
        return '' + value;

      case 'objecttype':
        return mongo.ObjectID(value);

      case 'bool':
        if (value === '') {
          return null;
        }
        return (value === '1' ? true : false);

      case 'int':
        if (!value.match(/^-?[\d]*$/))
          throw new Error('Die Zahl ist keine Nummer');
        return !value ? null : parseInt(value, 10);

      case 'image':
        if (!value)
          return null;
        if (value.substr(0, 4) === '_id:')
          return mongo.ObjectID(value.substr(4));
        var basePos = value.search(/base64,/);
        if (!basePos)
          return undefined;
        
        let matches = value.slice(0, basePos).match(/^data:.+\/(.+);$/);
        let ext = matches[1];
        let buffer = Buffer.from(value.slice(basePos + 7), 'base64');
        return { ext: ext, buffer: buffer };
      default:
        return value;
    }
  }

});
