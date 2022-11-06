var View = require("../views/Base");
describe("Base view", function() {
  test("create and render new view", function(next) {
    var responseMockup = {
      render: function(template, data) {
        expect(data.myProperty).toBe('value');
        expect(template).toBe('template-file');
        next();
      }
    }
    var v = new View(responseMockup, 'template-file');
    v.render({myProperty: 'value'});
  });
  test("should be extendable", function(next) {
    var v = new View();
    var OtherView = v.extend({
      render: function(data) {
        expect(data.prop).toBe('yes');
        next();
      }
    });
    var otherViewInstance = new OtherView();
    expect(otherViewInstance.render).toBeDefined();
    otherViewInstance.render({prop: 'yes'});
  });
});