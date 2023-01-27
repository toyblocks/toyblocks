'use strict';

var UsersController = require('../Users');

module.exports = function () {
};
module.exports.prototype = UsersController.prototype.extend({
  name: 'log',
  rightLevel: 400,

  inAction: function () {
    var returnto = this.request.paramNew('returnto');
    this.view.render({ returnto: returnto });
  },

  doLoginAction: function () {
    var returnto = this.request.paramNew('returnto');
    //this.request.session.user = { tuid: 'demo', rightLevel: 0 };
    if (returnto && returnto[0] === '/') {
      this.response.redirect(returnto);
    }
    else {
      this.response.redirect('/users/');
    }
  },

  outAction: function () {
    var _this = this;
    if (this.request.session.user) {
      delete this.request.session.user;
      delete this.request.session.password_given;
    }
    this.view.setNoNavBar(true);
    _this.getDbTexts(
      ['logout_text'],
      function (texts) {
        texts.title = 'Abgemeldet';
        _this.view.render(texts);
      });
  }

});
