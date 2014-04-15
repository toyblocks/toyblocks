'use strict';

var EncyclopediaController = require('../Encyclopedia');

module.exports = function () {};

module.exports.prototype = EncyclopediaController.prototype.extend({
  name: 'index',
  rightLevel: 300,

  /**
  *  indexAction() answers GET requests
  *  for the overview of article
  *
  * @return <String> title Title of indexpage
  * @return <Array> data
  */
  indexAction: function() {
    var _this = this,
      countPerPage = 50,
      findParams = _this.getFindParams();

    _this.mongodb
      .collection('encyclopedia_articles')
      .count(function(err, totalCount) {
        _this.setPagination(totalCount, countPerPage);
        _this.mongodb
          .collection('encyclopedia_articles')
          .find(
            findParams,
            {title: 1, _id: 1})
          .skip(_this.getPaginationSkip())
          .limit(_this.getPaginationLimit())
          .toArray(function(err, data){
            data.sort(function(a, b) {
              var textA = a.title.toUpperCase();
              var textB = b.title.toUpperCase();
              return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
            });


            var articles = [];

            var filterHeadlines = function(element) {
              return element.headline === currentLetter;
            };

            for (var i = 0; i < data.length; i++) {
              // get first letter of article title
              var currentLetter = data[i].title.charAt(0).toUpperCase();

              // filter articles array for first letter
              var currentElement = articles.filter(filterHeadlines);

              // check if there is an object for the current first letter
              if (currentElement.length) {
                currentElement[0].articles.push(data[i]);
              } else {
                articles.push({
                  headline: currentLetter,
                  articles: [data[i]]
                });
              }
            }

            _this.view.render({
              title: 'Enzyklopädie - Glossar',
              route: '/encyclopedia',
              data: articles
            });
          });
      });
  },

  /**
  *  articleAction() answers GET requests
  *  for actual encyclopedia articles
  *
  * @return <String> title
  * @return <String> article
  * @return <String> image
  */
  articleAction: function() {
    var _this = this;
    this.mongodb
    .collection('encyclopedia_articles')
    .find({_id: this.mongo.ObjectID(this.request.param('id'))})
    .nextObject(function(err, article) {
      _this.view.render({
        title: 'Enzyklopädie - ' + article.title,
        article: article.article_body,
        headline: article.title,
        route: '/encyclopedia',
        image: article.image
      });
    });
  }
});
