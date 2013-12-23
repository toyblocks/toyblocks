module.exports = function(response) {
  this.response = response;
};
module.exports.prototype = {
  extend: function(properties) {
    var Child = module.exports;
    Child.prototype = module.exports.prototype;
    for(var key in properties) {
      Child.prototype[key] = properties[key];
    }
    return Child;
  },
  render: function(data) {
    if(this.response && this.template && !this.disabled) {
      this.response.render(this.template, data);
    }
  },
  setTemplate: function(path) {
    this.template = path;
  },
  disable: function() {
    this.disabled = true;
  }
};
