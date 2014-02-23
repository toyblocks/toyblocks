'use strict';

var BaseController = require('../Moderation');

module.exports = function () {

};
module.exports.prototype = BaseController.prototype.extend({
  name: 'games',

  missingAction: function() {
    var _this = this;
    _this.view.render({
      title: 'Fehlstellenspiel hinzufügen'
    });
  }
});
