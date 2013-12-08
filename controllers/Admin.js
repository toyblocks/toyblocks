var BaseController = require('./Base'),
  View = require('../views/Base');
module.exports = BaseController.extend({
  name: 'Admin',
  run: function(req, res, next) {
    var v = new View(res, 'admin');
    v.render({
      title: 'Administration',
      content: 'Welcome to the control panel'
    });
  }
});