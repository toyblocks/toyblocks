'use strict';

var AdminObjectsController = require('../admin/Objects');

module.exports = function () {

};
module.exports.prototype = AdminObjectsController.prototype.extend({
  area: 'moderation',
  name: 'encyclopedia',
  rightLevel: 100,

  indexAction: function() {
    var _this = this,
      countPerPage = 20,
      page = _this.getPage();

    _this.mongodb
    .collection('encyclopedia_articles')
    .count(function (err1, totalCount) {
      _this.setPagination(totalCount, countPerPage);
      _this.mongodb
        .collection('encyclopedia_articles')
        .find({}, {title: 1, _id: 1})
        .skip(_this.getPaginationSkip())
        .limit(_this.getPaginationLimit())
        .toArray(function(err, data){
          _this.view.render({
            title: 'Enzyklopädie',
            route: '/moderation/encyclopedia',
            articles: data
          });
        });
    });
  },

  articleAction: function() {
    var _this = this;
    if(_this.request.param('id')) {
      _this.mongodb
      .collection('encyclopedia_articles')
      .find({_id: _this.mongo.ObjectID(_this.request.param('id'))})
      .nextObject(function(err, article) {
        console.log(article);
        _this.view.render({
          title: 'Enzyklopädie - ' + article.title,
          route: '/moderation/encyclopedia',
          id: article._id,
          image: article.image,
          article: article.article_body,
          headline: article.title,
        });
      });
    } else {
      _this.view.render({
          title: 'Enzyklopädie - Neuer Artikel',
          route: '/moderation/encyclopedia'
        });
    }
  },

  updateAction: function() {
    this.upsertObjectAction('/moderation/encyclopedia');
  },
  deleteAction: function() {
    this.deleteObjectAction('/moderation/encyclopedia');
  }
});
