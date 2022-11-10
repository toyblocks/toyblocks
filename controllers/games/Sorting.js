'use strict';

var GamesController = require('../Games'),
  Statistics = require('../admin/Stats');

module.exports = function () {

};

module.exports.prototype = GamesController.prototype.extend({
  name: 'sorting',

  /**
   * GET - This Method is used for the index page
   *
   * @return title - the title of the game
   */
  indexAction: function () {
    var _this = this;
    _this.getDbTexts(
      ['game_sorting_explain',
        'game_sorting_level1',
        'game_sorting_level2',
        'game_sorting_level3'],
      function (texts) {
        texts.title = 'Zeitstrahl - ToyBlocks';
        _this.view.render(texts);
      });
  },

  /** GET - This renders the main game
   *
   * @return buildings - an array of buildings to display for the template
   */
  gameAction: function () {
    var _this = this;
    var ids = _this.request.query.id;
    var level = parseInt(_this.request.query.level, 10) || 1;
    var limit = parseInt(_this.request.query.limit, 10) || 7;
    var isDaily = parseInt(_this.request.query.isDaily, 10) || 0;


    _this.increaseStat('level' + level + '_count_played');
    if (typeof ids === 'undefined') {
      _this.renderGame(level, function (_err, buildings) {
        buildings = _this.shuffleArray(buildings).slice(0, limit);
        _this.view.render({
          title: 'Zeitstrahl - ToyBlocks',
          level: level,
          buildings: buildings
        });
      });
    } else {
      ids = ids.split(',');
      for (let i = ids.length - 1; i >= 0; i--) {
        ids[i] = _this.mongo.ObjectID(ids[i]);
      }

      if (isDaily) {
        _this.view.setOnlyContent(true);
      }
      _this.mongodb
        .collection('sorting_buildings')
        .find({ _id: { $in: ids } })
        .toArray(function (_err, buildings) {
          buildings = _this.shuffleArray(buildings);
          _this.view.render({
            title: 'Zeitstrahl - ToyBlocks',
            level: level,
            isDaily: isDaily,
            buildings: buildings
          });
        });
    }
  },

  /** 
   * Gets the buildings from the database and returns it with a callback
   * 
   * @param level          - level of game
   * @param renderCallback - the callback to call after we got the buildings
   */
  renderGame: function (level, renderCallback) {
    if (level === 3) {
      // Only level 2 buildings
      this.mongodb
        .collection('sorting_buildings')
        .find({ level: 2, active: true })
        .toArray(renderCallback);
    } else if (level === 2) {
      // Level 1 and level 2
      this.mongodb
        .collection('sorting_buildings')
        .find({ active: true })
        .toArray(renderCallback);
    } else {
      // only level 1
      this.mongodb
        .collection('sorting_buildings')
        .find({ level: 1, active: true })
        .toArray(renderCallback);
    }
  },


  /**
   * POST request to check the solution
   * the parameters are from the <form> element
   *
   * @param sortings  - an array of ids, shows how the images were sorted
   */
  checkSortingAction: function () {
    var _this = this;
    var sortIds = _this.request.body['sortings[]'];

    if (typeof sortIds === 'undefined' || sortIds === '') {
      _this.response.json({
        error: 'Error: Keine Elemente übergeben.'
      });
    }

    // get the era attribute with correct sorting of eras
    _this.mongodb
      .collection('attributes')
      .find({ name: 'era' })
      .next(function (_err, attribute) {

        var eras = attribute.values;
        var sortedBuildings = {};

        // we have to cast the mongo ids for the db-request
        for (let i = 0; i < sortIds.length; i++) {
          sortIds[i] = _this.mongo.ObjectID(sortIds[i]);
          sortedBuildings[sortIds[i]] = null;
        }

        _this.mongodb.collection('sorting_buildings')
          .find({ _id: { $in: sortIds } })
          .toArray(function (_err1, buildings) {

            // got all requested buildings, now calculate if sorting is right
            var lastEraIndex = 0;
            var orderNumbers = [];
            var solutionIsCorrect = true;

            for (let i = 0; i < buildings.length; i++) {
              sortedBuildings['' + buildings[i]._id] = buildings[i];
            }

            for (var _id in sortedBuildings) {
              if (!sortedBuildings[_id]) {
                continue;
              }

              // go through all buildings and check index of era in era-array
              var buildingEraIndex = eras.indexOf(sortedBuildings[_id].era);
              orderNumbers.push(buildingEraIndex);

              if (buildingEraIndex < lastEraIndex) {
                solutionIsCorrect = false;
              }
              lastEraIndex = buildingEraIndex;
            }

            // Display which elements are on a wrong position
            var order = [];
            var prepend = 0;
            var same = 0;
            for (var k = 0; k < orderNumbers.length; k++) {
              same = prepend = 0;
              for (var j = 0; j < orderNumbers.length; j++) {
                if (orderNumbers[k] > orderNumbers[j])
                  prepend++;
                else if (orderNumbers[k] === orderNumbers[j])
                  same++;
              }
              order.push(prepend <= k && k <= (prepend + same - 1));
            }

            // reuse buildings array and sort them for result page
            for (let i = 0; i < buildings.length; i++) {
              buildings[i].position = eras.indexOf(buildings[i].era);
            }
            buildings.sort(function (a, b) {
              return a.position - b.position;
            });

            // Update Stats
            Statistics.prototype.insertStats(_this, 'sorting');

            // response with a json object
            _this.response.json({
              correct: solutionIsCorrect,
              order: order,
              result: buildings
            });
          });
      });
  }
});