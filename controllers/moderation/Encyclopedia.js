'use strict';

var BaseController = require('../Moderation');

module.exports = function () {

};
module.exports.prototype = BaseController.prototype.extend({
  name: 'encyclopedia',

  indexAction: function() {
    var _this = this;
    _this.mongodb
    .collection('encyclopedia_articles')
    .find({}, {title: 1, _id: 1})
    .toArray(function(err, data){
      _this.view.render({
        title: 'Enzyklopädie',
        articles: data
      });
    });
  },
  articleAction: function() {
    var _this = this;
    if(this.request.param('id')) {
      this.mongodb
      .collection('encyclopedia_articles')
      .find({_id: this.mongo.ObjectID(this.request.param('id'))})
      .nextObject(function(err, article) {
        _this.view.render({
          title: 'Enzyklopädie - ' + article.title,
          article: article.article_body,
          headline: article.title,
        });
      });
    } else {
      _this.view.render({
          title: 'Enzyklopädie - Neuer Artikel'
        });
    }
  }
});
