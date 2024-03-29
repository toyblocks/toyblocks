'use strict';

var EncyclopediaController = require('../Encyclopedia');

module.exports = function () { };

module.exports.prototype = EncyclopediaController.prototype.extend({
  name: 'index',
  rightLevel: 300,

  /**
  *  indexAction() answers GET requests
  *  for the overview of article
  *
  * @return <String> title Title of indexpage
  * @return <String> route 
  * @return <Array> data Array of articles and buildings
  * @return <Array> customPagination
  */
  indexAction: function () {
    var _this = this;
    var countPerPage = 42;
    var findParams = _this.getFindParams();
    var filterParams = _this.getFilterParams();

    _this.mongodb
      .collection('encyclopedia_articles')
      .find({ $and: [findParams, filterParams] }, {})
      .count(function (_err, articleCount) {

        _this.mongodb
          .collection('sorting_buildings')
          .find({ $and: [findParams, filterParams, { active: true }] }, {})
          .count(function (_err1, buildingCount) {

            _this.setPagination(articleCount + buildingCount, countPerPage);
            var skip = _this.getPaginationSkip(),
              limit = _this.getPaginationLimit();

            _this.mongodb
              .collection('encyclopedia_articles')
              .find({ $and: [findParams, filterParams] }, { title: 1, _id: 1 })
              .toArray(function (_err2, articleData) {

                _this.mongodb
                  .collection('sorting_buildings')
                  .find({ $and: [findParams, filterParams, { active: true }] }, { title: 1, _id: 1, image: 1 })
                  .toArray(function (_err3, buildingData) {

                    // Merge bulding and article arrays
                    for (let i = 0; i < articleData.length; i++) {
                      articleData[i].isArticle = true;
                    }
                    for (let i = 0; i < buildingData.length; i++) {
                      buildingData[i].isArticle = false;
                      buildingData[i].image = buildingData[i].image[0] || null;
                    }
                    var data = articleData.concat(buildingData);

                    // Sort data in regards to umlauts
                    data.sort(function (a, b) {
                      a = (a.title + "").toLowerCase();
                      a = a.replace("ä", "ae");
                      a = a.replace("ü", "ue");
                      a = a.replace("ö", "oe");
                      a = a.replace("ß", "ss");
                      b = (b.title + "").toLowerCase();
                      b = b.replace("ä", "ae");
                      b = b.replace("ö", "oe");
                      b = b.replace("ü", "ue");
                      b = b.replace("ß", "ss");
                      return a.localeCompare(b);
                    });

                    function pagStyle(i) {
                      return (i.title + "").charAt(0).toUpperCase() + (i.title + "").charAt(1);
                    }

                    if (data.length === 0) {
                      _this.view.render({
                        title: 'Glossar - Enzyklopädie - ToyBlocks',
                        route: '/encyclopedia',
                        data: [],
                        customPagination: []
                      });
                      return;
                    }

                    // Create custom pagination
                    var customPagination = [],
                      pagCounter = 1,
                      firstLetter = data[0].title.charAt(0).toUpperCase(),
                      lastLetter;

                    for (let i = countPerPage; i < data.length; i = i + countPerPage) {
                      lastLetter = pagStyle(data[i - 1]);
                      customPagination[pagCounter++] = firstLetter + ' - ' + lastLetter;
                      firstLetter = pagStyle(data[i]);
                    }

                    // when there is only one page use firstLetter instead
                    if (typeof lastLetter === 'undefined') {
                      customPagination[pagCounter] = firstLetter + ' - ' + data[data.length - 1].title.charAt(0).toUpperCase();
                    } else {
                      customPagination[pagCounter] = lastLetter + ' - ' + data[data.length - 1].title.charAt(0).toUpperCase();
                    }

                    // Skip elements according to pagination skips
                    data = data.slice(skip, skip + limit);


                    // Create element array with highlighted letters
                    var articles = [];
                    var filterHeadlines = function (element) {
                      return element.headline === currentLetter;
                    };
                    for (let i = 0; i < data.length; i++) {
                      // get first letter of article title
                      var currentLetter = (data[i].title + "").charAt(0).toUpperCase();

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
                      data: articles,
                      customPagination: customPagination
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
  articleAction: function () {
    var _this = this;
  
    _this.mongodb
      .collection('encyclopedia_articles')
      .find({ _id: _this.mongo.ObjectID(_this.request.query.id) })
      .next(function (_err, article) {
        _this.view.render({
          title: article.title + ' - Enzyklopädie - ToyBlocks',
          article: article.article_body,
          headline: article.title,
          route: '/encyclopedia',
          image: article.image
        });

        /* update statistics */
        _this.mongodb
          .collection('encyclopedia_articles')
          .updateOne({ _id: _this.mongo.ObjectID(_this.request.query.id) },
            { $inc: { 'viewcount': +1 } },
            { upsert: true }, function (err) {
              if (err) console.log(err);
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
  buildingAction: function () {
    var _this = this;
    var buildingid = _this.request.query.id;

    _this.mongodb
      .collection('sorting_buildings')
      .find({ _id: _this.mongo.ObjectID(buildingid) })
      .next(function (_err, building) {
        _this.view.render({
          title: building.title + ' - Enzyklopädie - ToyBlocks',
          building: building,
          route: '/encyclopedia'
        });

        /* update statistics */
        _this.mongodb
          .collection('sorting_buildings')
          .updateOne({ _id: _this.mongo.ObjectID(buildingid) },
            { $inc: { 'viewcount': +1 } },
            { upsert: true }, function (err) {
              if (err) console.log(err);
            });
      });
  }
});
