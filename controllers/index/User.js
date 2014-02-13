'use strict';

var BaseController = require('../Base');

module.exports = function () {
};
module.exports.prototype = BaseController.prototype.extend({
  area: 'index',
  name: 'user',

  indexAction: function() {
    this.view.render({
      title: 'Startseite',
      route: '/'
    });
  },

  loginAction: function() {
    var returnto = this.request.param('returnto');
    this.view.render({returnto: returnto});
  },

  doLoginAction: function() {
    var returnto = this.request.param('returnto');
    // TODO: check login here
    this.request.session.user = {tuid: 'yoman'};
    if (returnto && returnto[0] === '/') {
      this.response.redirect(returnto);
    }
    else {
      this.response.redirect('/user/');
    }
  }

});
