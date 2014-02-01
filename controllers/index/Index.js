var BaseController = require('../Base');

module.exports = function () {
};
module.exports.prototype = BaseController.prototype.extend({
  area: 'index',
  name: 'index',

  indexAction: function() {
    this.view.render({title: 'Startseite'});
  },


  aboutAction: function () {
    var _this = this;

    _this.view.render({
      title: 'Über uns'
    });
  }
});
