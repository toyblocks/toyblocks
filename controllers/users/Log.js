'use strict';

var UsersController = require('../Users');

module.exports = function () {
};
module.exports.prototype = UsersController.prototype.extend({
  name: 'log',

  inAction: function() {
    var returnto = this.request.param('returnto');
    this.view.render({returnto: returnto});
  },

  doLoginAction: function() {
    var returnto = this.request.param('returnto');
    // TODO: check login here
    this.request.session.user = {tuid: 'm_iqbal', rightLevel: 0};
    if (returnto && returnto[0] === '/') {
      this.response.redirect(returnto);
    }
    else {
      this.response.redirect('/users/');
    }
  },

  outAction: function() {
    if (this.request.session.user) {
      delete this.request.session.user;
      delete this.request.session.password_given;
    }
    this.view.setNoNavBar(true);
    this.view.render({});
  }

});
