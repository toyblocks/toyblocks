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
    this.view.render({
      title: 'Information'
    });
  },


  impressumAction: function () {
    this.view.render({
      title: 'Impressum'
    });
  },

  error404Action: function () {
    this.view.render({
      title: '404 Seite nicht gefunden'
    });
  },

  // TODO: get actual date from db
  lastupdateAction: function() {
    var _this = this;
    function fill(n, length) {
      var str = '' + n;
      for (var i = str.length+1; i <= length; i++) {
          str = '0' + str;
      }
      return str;
    }
    var date = new Date();
    var string = date.getFullYear()         + "-" + 
                fill((date.getMonth()+1),2) + "-" +
                fill( date.getDate()    ,2) + " " +
                fill( date.getHours()   ,2) + ":" +
                fill( date.getMinutes() ,2) + "\n";
    _this.response.json({lastupdate:string});
  }
});
