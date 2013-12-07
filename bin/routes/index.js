
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