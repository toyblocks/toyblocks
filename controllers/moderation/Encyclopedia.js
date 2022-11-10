'use strict';

var AdminObjectsController = require('../admin/Objects');

module.exports = function () {

};
module.exports.prototype = AdminObjectsController.prototype.extend({
  area: 'moderation',
  name: 'encyclopedia',
  rightLevel: 100,

  indexAction: function () {
    var _this = this,
      countPerPage = 30,
      findParams = _this.getFindParams(),
      filterParams = _this.getFilterParams(),
      sortParams = _this.getSortParams();
    
    if(sortParams && Object.keys(sortParams).length === 0)
      sortParams = { title: 1 };
    if (sortParams.viewcount === 1) {
      sortParams.viewcount = -1;
    }

    _this.mongodb
      .collection('encyclopedia_articles')
      .find({ $and: [findParams, filterParams] }, {})
      .count(function (_err1, totalCount) {

        _this.setPagination(totalCount, countPerPage);
        var skip = _this.getPaginationSkip();
        var limit = _this.getPaginationLimit();

        _this.mongodb
          .collection('encyclopedia_articles')
          .find({ $and: [findParams, filterParams] }, {})
          .sort(sortParams)
          .toArray(function (_err, articleData) {
            var data = articleData.slice(skip, skip + limit);
            for (var i = 0; i < data.length; i++) {
              data[i].article_body = (data[i].article_body + '').slice(0, 80);
            }

            _this.view.render({
              title: 'Enzyklopädie - ToyBlocks',
              route: '/moderation/encyclopedia',
              articles: data
            });
        });
      });
  },

  articleAction: function () {
    var _this = this;
    var id = _this.request.query.id;
    if (id) {
      _this.mongodb
        .collection('encyclopedia_articles')
        .find({ _id: _this.mongo.ObjectID(id) })
        .next(function (_err, article) {
          _this.view.render({
            title: article.title + ' - Enzyklopädie - ToyBlocks',
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

  updateAction: function () {
    this.upsertObjectAction('/moderation/encyclopedia');
  },
  deleteAction: function () {
    this.deleteObjectAction('/moderation/encyclopedia');
  }
});
