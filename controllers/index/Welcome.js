'use strict';

var BaseController = require('../Base');

module.exports = function () {
};
module.exports.prototype = BaseController.prototype.extend({
  area: 'index',
  name: 'welcome',
  rightLevel: 300,

  indexAction: function() {
    var _this = this;

    this.mongodb
    .collection('website_texts')
    .find({})
    .nextObject(function(err, texts) {
      _this.view.render({
        headline: texts.welcome_title,
        body: texts.welcome_body,
        sorting: texts.welcome_sorting,
        challenge: texts.welcome_challenge,
        assemble: texts.welcome_assemble,
        missing: texts.welcome_missing,
        multiplechoice: texts.welcome_multiplechoice
      });
    });
  },

});
