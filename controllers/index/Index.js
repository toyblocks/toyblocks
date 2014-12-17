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
      this.response.redirect('/welcome');
    }
    else {
      this.view.setNoNavBar(true);
      this.view.render({
        title: 'Startseite'
      });
    }
  },

  welcomeAction: function() {
    this.view.render({});
  },

  aboutAction: function () {
    var _this = this;
    _this.getDbTexts(
      ['information'],
      function(texts) {
        _this.view.render({
          title: 'Information',
          text: texts.information
        });
      });
  },

  impressumAction: function () {
    var _this = this;
    _this.getDbTexts(
      ['imprint'],
      function(texts) {
        _this.view.render({
          title: 'Impressum',
          text: texts.imprint
        });
      });
  },

  error404Action: function () {
    this.view.render({
      title: '404 Seite nicht gefunden'
    });
  },

  lastupdateAction: function() {
    var _this = this;

    function fill(n, length) {
      var str = '' + n;
      for (var i = str.length+1; i <= length; i++) {
        str = '0' + str;
      }
      return str;
    }

    _this.mongodb
      .collection('system_config')
      .find({key: 'last_modified'})
      .nextObject(function(err, doc){

        if (doc) {
          var date = doc.value;
          var string = date.getFullYear()         + '-' +
                      fill((date.getMonth()+1),2) + '-' +
                      fill( date.getDate()    ,2) + ' ' +
                      fill( date.getHours()   ,2) + ':' +
                      fill( date.getMinutes() ,2) + '\n';
          _this.response.json({lastupdate:string});
        }
      });
  }
});
