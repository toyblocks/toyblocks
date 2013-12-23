describe('Configuration setup', function() {
  it('should load local configurations', function(next) {
    var config = require('../configs')();
    expect(config.mode).toBe('local');
    next();
  });
  it('should load staging configurations', function(next) {
    var config = require('../configs')('staging');
    expect(config.mode).toBe('staging');
    next();
  });
  it('should load production configurations', function(next) {
    var config = require('../configs')('production');
    expect(config.mode).toBe('production');
    next();
  });
});
