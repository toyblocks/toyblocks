describe('Configuration setup', function() {
  test('should load local configurations', function(next) {
    var config = require('../configs')();
    expect(config.mode).toBe('local');
    next();
  });
  test('should load staging configurations', function(next) {
    var config = require('../configs')('staging');
    expect(config.mode).toBe('staging');
    next();
  });
  test('should load production configurations', function(next) {
    var config = require('../configs')('production');
    expect(config.mode).toBe('production');
    next();
  });
});
