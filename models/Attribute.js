var BaseModel = require('./Base'),
	base = new BaseModel();

module.exports = base.extend({
  collection: 'attributes',

  getTypes: function() {
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
    ];
    return types;
  }

});
