
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Testing out Toyblocks!',
                        content: 'Toyblocks Startseite'});
};