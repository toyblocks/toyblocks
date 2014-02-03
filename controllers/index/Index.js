var BaseController = require('../Base');

module.exports = function () {
};
module.exports.prototype = BaseController.prototype.extend({
  area: 'index',
  name: 'index',

  indexAction: function() {
    this.view.render({
      title: 'Startseite',
      route: '/'
    });
  },



  aboutAction: function () {
    this.view.render({
      title: 'Über uns',
      route: '/index/about'
    });
  },

  error404Action: function () {
    this.view.render({
      title: '404 Seite nicht gefunden'
    });
  }
});
