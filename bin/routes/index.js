
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Startseite'});
};

/*
 * GET sort buildings game.
 */

exports.sortbuildings = function(req, res){
  res.render('sortbuildings', { title: 'Bauwerke sortieren'});
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
      var regex = /^data:.+\/(.+);base64,(.*)$/;
      var matches = req.param('picture').match(regex);
      var ext = matches[1];
      var data = matches[2];
      var buffer = new Buffer(data, 'base64');
      req.mongodb.collection('pictures').insert({
        filename: req.param('picturename'),
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
      });
      break;
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



