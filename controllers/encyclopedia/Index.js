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
      findParams = _this.getFindParams(),
      filterParams = _this.getFilterParams();

    _this.mongodb
      .collection('encyclopedia_articles')
      .count(function(err, articleCount) {

        _this.mongodb
          .collection('sorting_buildings')
          .find({active: true})
          .count(function (err, buildingCount) {

            _this.setPagination(articleCount + buildingCount, countPerPage);
            var skip = _this.getPaginationSkip(),
              limit = _this.getPaginationLimit();

            _this.mongodb
              .collection('encyclopedia_articles')
              .find({$and: [findParams, filterParams]}, {title: 1, _id: 1})
              .toArray(function(err, articleData){

                _this.mongodb
                  .collection('sorting_buildings')
                  .find({$and: [findParams, filterParams, {active: true}]}, {title: 1, _id: 1, image: 1})
                  .toArray(function(err, buildingData){

                    for (var i = 0; i < articleData.length; i++) {
                      articleData[i].isArticle = true;
                    };
                    for (var i = 0; i < buildingData.length; i++) {
                      buildingData[i].isArticle = false;
                      buildingData[i].image = buildingData[i].image[0] || null;
                    };
                    
                    var data = articleData.concat(buildingData);
                    // Sort and cut data
                    data.sort(function(a, b) {
                      return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
                    });
                    data = data.slice(skip, skip + limit);


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
                      title: 'Glossar - Enzyklopädie - ToyBlocks',
                      route: '/encyclopedia',
                      data: articles
                    });
                });
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
    _this.mongodb
    .collection('encyclopedia_articles')
    .find({_id: _this.mongo.ObjectID(_this.request.param('id'))})
    .nextObject(function(err, article) {
      _this.view.render({
        title: article.title + ' - Enzyklopädie - ToyBlocks',
        article: article.article_body,
        headline: article.title,
        route: '/encyclopedia',
        image: article.image
      });
    });
  },

  /**
  *  buildingAction() answers GET requests
  *  for encyclopedia buildings from sorting game
  *
  * @return <String> title
  * @return <String> article
  * @return <String> image
  */
  buildingAction: function() {
    var _this = this,
      buildingid = _this.request.param('id');

    _this.mongodb
      .collection('sorting_buildings')
      .find({_id: _this.mongo.ObjectID(buildingid)})
      .nextObject(function (err, building){
          _this.view.render({
            title: building.title + ' - Enzyklopädie - ToyBlocks',
            building: building,
            route: '/encyclopedia'
          });
      });
  }
});
