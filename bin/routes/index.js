var buildings = require('../models/buildings');

/*
 * GET home page.
 */

exports.index = function(req, res) {
  res.render('index', {
    title: 'Startseite',
    route: '/'
  });
};

/*
 * GET sort buildings game.
 */

exports.sortBuildings = function(req, res) {
  res.render('games/sortbuildings', {
    title: 'Bauwerke sortieren',
    route: '/sortbuildings',
    gameData: buildings
  });
};

exports.validateOrder = function(req, res) {
  var sorted = buildings.sort(function (a, b) {
    if (a.year > b.year)
      return 1;
    if (a.year < b.year)
      return -1;
    // a must be equal to b
    return 0;
  });
  var spliced = [];
  sorted.forEach(function(element) {
    var tmp = element.buildingid;
    spliced.push(tmp.toString());
  });

  if(arraysEqual(spliced, req.body.buildingid)) {
    res.send('Korrekt!');
  } else {
    res.send('Leider falsch, bitte nocheinmal versuchen');
  }
};


function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length != b.length) return false;

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}