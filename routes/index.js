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
 * GET admin
 */
exports.admin = function(req, res){
  res.render('admin/index', { title: 'Administration'});
};

/*
 * GET admin
 */
exports.admin_pictures = function(req, res){
  if (req.params.action) {
    switch (req.params.action){
    case 'upload':
      var pictureData = req.param('picture'),
        basePos = pictureData.search(/base64,/),
        matches = pictureData.slice(0,basePos).match(/^data:.+\/(.+);$/),
        ext = matches[1],
        buffer = new Buffer(pictureData.slice(basePos+7), 'base64');
      req.mongodb.collection('pictures').insert({
        filename: req.param('picturename'),
        name: req.param('name'),
        era: req.param('era'),
        year: req.param('year'),
        type: ext,
        data: req.mongo.Binary(buffer),
        date_inserted: req.mongo.Timestamp() // TODO: timestamp does not work like this
      },
      {w:1},
      function(err, objects) {
        if (err) console.warn(err.message);
        if (err && err.message.indexOf('E11000 ') !== -1) {
          // this _id was already inserted in the database
        }
        res.redirect('/admin/pictures/');
      });
      return;
    }
  }
  var pictures = [];
  req.mongodb
    .collection('pictures')
    .find({})
    .each(function(err, doc) {
      if (doc) {
        doc.data = doc.data.toString('base64');
        pictures.push(doc);
      }
      else {
        res.render('admin/pictures', {
          title: 'Bilder verwaltung',
          pictures: pictures
        });
      }
    });
};



exports.dbimage = function(req, res){
  if (req.param('id')) {
    req.mongodb
      .collection('pictures')
      .find({_id: req.mongo.ObjectID(req.param('id'))})
      .nextObject(function(err, doc) {
        if (doc) {
          res.type('image/' + doc.type);
          res.send(doc.data.value(true));
        }
        else {
          res.send(404, 'Image not found');
        }
      });
  }
};


exports.sortBuildings = function(req, res) {
  res.render('games/sortbuildings', {
    title: 'Bauwerke sortieren',
    route: '/sortbuildings',
    gameData: buildings
  });
};


/*
 * Validates if the game /sortbuildings is correct
 * and sends a message.
 *
*/
exports.validateOrder = function(req, res) {
  var sorted = buildings.sort(function(a, b) {
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

  if (arraysEqual(spliced, req.body.buildingid)) {
    res.send('Korrekt!');
  } else {
    res.send('Leider falsch, bitte nocheinmal versuchen');
  }
};

/*
 * Return true if arrays are equal
*/
function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length != b.length) return false;

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }

  return true;
}