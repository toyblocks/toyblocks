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
  indexAction: function() {
    var _this = this;
    _this.getDbTexts(
      ['game_sorting_explain'],
      function(texts) {
        texts.title = 'Zeitstrahl';
        _this.view.render(texts);
      });
  },

/** GET - This renders the main game
 *
 * @return buildings - an array of buildings to display for the template
 */
  gameAction: function() {
    var _this = this,
      ids = _this.request.param('id'),
      level = parseInt(_this.request.param('level'),10) || 1,
      limit = parseInt(_this.request.param('limit'),10) || 7,
      isDaily = parseInt(_this.request.param('isDaily'),10) || 0;


    _this.increaseStat('level'+level+'_count_played');
    if(typeof ids === 'undefined'){
      _this.renderGame(level, function(err, buildings){
        buildings = _this.shuffleArray(buildings).slice(0,limit);
        _this.view.render({
          title: 'Zeitstrahl',
          level: level,
          buildings: buildings
        });
      });
    }else{
      ids = ids.split(',');
      for (var i = ids.length - 1; i >= 0; i--) {
        ids[i] = _this.mongo.ObjectID(ids[i]);
      }
      
      if(isDaily){
        _this.view.setOnlyContent(true);
      }
      _this.mongodb
        .collection('sorting_buildings')
        .find({_id: {$in: ids}})
        .toArray(function (err, buildings) {
          buildings = _this.shuffleArray(buildings);
          _this.view.render({
            title: 'Zeitstrahl',
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
  renderGame: function(level, renderCallback) {
    if (level === 3) {

      // Only level 2 buildings
      this.mongodb
        .collection('sorting_buildings')
        .find({level: 2, active: true})
        .toArray(renderCallback);
    }else if (level === 2) {

      // Level 1 and level 2
      this.mongodb
        .collection('sorting_buildings')
        .find({active: true})
        .toArray(renderCallback);
    } else {

      // only level 1
      this.mongodb
        .collection('sorting_buildings')
        .find({level: 1, active: true})
        .toArray(renderCallback);
    }
  },


/**
 * POST request to check the solution
 * the parameters are from the <form> element
 *
 * @param sortings  - an array of ids, shows how the images were sorted
 */
  checkSortingAction: function() {
    var _this = this,
      sortIds = _this.request.param('sortings');

    if(typeof sortIds === 'undefined'){
      _this.response.json({
        error: 'Error: Keine Elemente übergeben.'
      });
    }

    // get the era attribute with correct sorting of eras
    _this.mongodb
      .collection('attributes')
      .find({name: 'era'})
      .nextObject(function(err, attribute) {

        var eras = attribute.values,
            sortedBuildings = {};
        
        // we have to cast the mongo ids for the db-request
        for (var i = 0; i < sortIds.length; i++) {
          sortIds[i] = _this.mongo.ObjectID(sortIds[i]);
          sortedBuildings[sortIds[i]] = null;
        }

        _this.mongodb.collection('sorting_buildings')
          .find({_id: {$in: sortIds}})
          .toArray(function(err, buildings) {

            // got all requested buildings, now calculate if sorting is right
            var lastEraIndex = 0,
              orderNumbers = [],
              solutionIsCorrect = true;

            for (var i = 0; i < buildings.length; i++) {
              sortedBuildings[''+buildings[i]._id] = buildings[i];
            }
            var index = 0;
            for (var _id in sortedBuildings) {
              if (!sortedBuildings[_id]){
                continue;
              }

              // go through all buildings and check index of era in era-array
              var buildingEraIndex = eras.indexOf(sortedBuildings[_id].era);
              orderNumbers.push(buildingEraIndex);

              if (buildingEraIndex < lastEraIndex){
                solutionIsCorrect = false;
              }
              lastEraIndex = buildingEraIndex;
            }

            // Display which elements are on a wrong position
            var order = [],
              prepend,
              same;
            for (var k = 0; k < orderNumbers.length; k++) {
              same = prepend = 0;
              for (var j = 0; j < orderNumbers.length; j++) {
                if(orderNumbers[k] > orderNumbers[j])
                  prepend++;
                else if(orderNumbers[k] === orderNumbers[j])
                  same++;
              }
              order.push(prepend <= k && k <= (prepend + same - 1));
            }

            // reuse buildings array and sort them for result page
            for (var i = 0; i < buildings.length; i++) {
              buildings[i].position = eras.indexOf(buildings[i].era);
            }
            buildings.sort(function (a,b) {
              return a.position > b.position;
            });

            // Update Stats
            Statistics.prototype.insertStats(_this, { $inc : { 'sorting': +1 }});

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