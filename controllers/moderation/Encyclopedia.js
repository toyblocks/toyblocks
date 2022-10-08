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
      .find({ $and: [filterParams, findParams] })
      .count(function (err1, totalCount) {

        _this.setPagination(totalCount, countPerPage);
        _this.mongodb
          .collection('encyclopedia_articles')
          .find(findParams,
            {
              title: 1,
              _id: 1,
              article_body: 1,
              image: 1,
              viewcount: 1
            })
          .skip(_this.getPaginationSkip())
          .limit(_this.getPaginationLimit())
          .sort(sortParams)
          .toArray(function (err, data) {

            for (var i = 0; i < data.length; i++) {
              data[i].article_body = data[i].article_body.slice(0, 80);
            };

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
    if (_this.request.param('id')) {
      _this.mongodb
        .collection('encyclopedia_articles')
        .find({ _id: _this.mongo.ObjectID(_this.request.param('id')) })
        .next(function (err, article) {
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
