'use strict';

module.exports = function (controller) {
  this.response = controller.response;
  this.controller = controller;
};
module.exports.prototype = {
  onlyContent: false,
  noNavBar: false,
  params: {},

  extend: function (properties) {
    var Child = module.exports;
    Child.prototype = module.exports.prototype;
    for (var key in properties) {
      Child.prototype[key] = properties[key];
    }
    return Child;
  },
  render: function (data) {
    data._viewOnlyContent = this.onlyContent;
    data._noNavBar = this.noNavBar;
    data._area = this.controller.area;
    data._controller = this.controller.name;
    data._action = this.controller.action;
    data._user = this.controller.request.session.user;
    // We query the db for every render because
    // the db values for admin/moderator can change
    // and we need to reflect it on the view
    this.controller.mongodb
      .collection('users')
      .find({ 'tuid': data._user.tuid })
      .next((_err, doc) => {
        if(doc !== null)
          data._user = doc;
        data._isAdmin = (doc && doc.right_level <= 100) ? true : false;
        data._isModerator = (doc && doc.right_level <= 200) ? true : false;
        data._messages = this.controller.getMessages();
        for (var param in this.params) {
          data[param] = this.params[param];
        }
        if (this.response && this.template && !this.disabled) {
          this.response.render(this.template, data);
        }
      });
  },
  setTemplate: function (path) {
    this.template = path;
  },
  getTemplate: function () {
    return this.template;
  },
  disable: function () {
    this.disabled = true;
  },
  setOnlyContent: function (onlyContent) {
    this.onlyContent = onlyContent;
  },
  setNoNavBar: function (noNavBar) {
    this.noNavBar = noNavBar;
  },
  setParam: function (param, value) {
    this.params[param] = value;
  },
  addParams: function (keyValueParams) {
    for (var param in keyValueParams) {
      this.params[param] = keyValueParams[param];
    }
  }
};
