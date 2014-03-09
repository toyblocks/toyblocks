'use strict';

var BaseController = require('../Base');

module.exports = function () {
};
module.exports.prototype = BaseController.prototype.extend({
  area: 'index',
  name: 'index',

  indexAction: function() {
    var user = this.getUser();
    if (user) {
      this.response.redirect('/index/welcome');
    }
    else {
      this.view.setNoNavBar(true);
      this.view.render({
        title: 'Startseite',
        route: '/'
      });
    }
  },

  welcomeAction: function() {
    this.view.render({});
  },


  aboutAction: function () {
    this.view.render({
      title: 'Über uns',
      route: '/index/about'
    });
  },

  error404Action: function () {
    this.view.render({
      title: '404 Seite nicht gefunden',
      route: '/'
    });
  }
});
