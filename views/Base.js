'use strict';

module.exports = function(controller) {
  this.response = controller.response;
  this.controller = controller;
};
module.exports.prototype = {
  onlyContent: false,

  extend: function(properties) {
    var Child = module.exports;
    Child.prototype = module.exports.prototype;
    for(var key in properties) {
      Child.prototype[key] = properties[key];
    }
    return Child;
  },
  render: function(data) {
    data._viewOnlyContent = this.onlyContent;
    data._area = this.controller.area;
    data._controller = this.controller.name;
    data._action = this.controller.action;
    data._user = this.controller.request.session.user;
    if(this.response && this.template && !this.disabled) {
      this.response.render(this.template, data);
    }
  },
  setTemplate: function(path) {
    this.template = path;
  },
  getTemplate: function() {
    return this.template;
  },
  disable: function() {
    this.disabled = true;
  },
  setOnlyContent: function(onlyContent) {
    this.onlyContent = onlyContent;
  }
};
