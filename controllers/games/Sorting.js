'use strict';

var GamesController = require('../Games');

module.exports = function () {

};

module.exports.prototype = GamesController.prototype.extend({
  name: 'sorting',

/**
 * GET - This Method is used for the index page
 *
 * @return title - the title of the game
 * @return route - url route
 */
  indexAction: function() {
    this.view.render({
      title: 'Sortierspiel',
      route: '/games/sorting'
    });
  },

/** GET - This renders the main game
 *
 * @return buildings - an array of buildings to display for the template
 */
  gameAction: function() {
    var _this = this,
        level = parseInt(this.request.param('level'),10),
        limit = parseInt(this.request.param('limit'),10);

    _this.renderGame(level, limit, function(err, buildings){
      _this.view.render({
        title: 'Sortierspiel',
        route: '/games/sorting',
        buildings: buildings
      });
    });
  },

/** 
 * Gets the buildings from the database and returns it with a callback
 * 
 * @param countLimit     - count limit of buildings
 * @param renderCallback - the callback to call after we got the buildings
 * @param game           - information about the current game
 */
  renderGame: function(level, countLimit, renderCallback) {
    var buildingLimit = countLimit || 7;
    if (level === 3) {

      // Only level 2 buildings
      this.mongodb
        .collection('sorting_buildings')
        .find({level: 2, _random: {$near: [Math.random(), 0]}})
        .limit(buildingLimit)
        .toArray(renderCallback);

    }else if (level === 2) {

      // Level 1 and level 2
      this.mongodb
        .collection('sorting_buildings')
        .find({_random: {$near: [Math.random(), 0]}})
        .limit(buildingLimit)
        .toArray(renderCallback);
    }
    else {

      // only level 1
      this.mongodb
        .collection('sorting_buildings')
        .find({level: 1, _random: {$near: [Math.random(), 0]}})
        .limit(buildingLimit)
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

      //TODO: Rewrite this function...

    // get the era attribute with correct sorting of eras
    _this.mongodb
      .collection('attributes')
      .find({name: 'era'})
      .nextObject(function(err, attribute) {

        var eras = attribute.values,      
            sortedBuildings = {};
        if(sortIds === undefined){
          _this.response.json({
            error: 'Irgendwas ist schiefgelaufen!'
          });
        }
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
              lastCorrectBuilding = -1,
              correct = true;

            // TODO:
            // gameparam: show last right
            // gameparam: show right solution
            // gameparam: show only correct or false
            // gameparam: num of possible tries

            for (var i = 0; i < buildings.length; i++) {
              sortedBuildings[''+buildings[i]._id] = buildings[i];
            }

            var buildingIndex = 0;
            for (var _id in sortedBuildings) {
              if (!sortedBuildings[_id]){ continue; }

              // go through all buildings and check index of era in era-array
              var buildingEraIndex = eras.indexOf(sortedBuildings[_id].era);

              if (buildingEraIndex < lastEraIndex) {
                correct = false;
                break;
              }
              lastEraIndex = buildingEraIndex;
              lastCorrectBuilding = buildingIndex;
              buildingIndex++;
            }
            
            // response with a json object
            _this.response.json({
              correct: correct,
              lastCorrectBuilding: lastCorrectBuilding
            });
          });
      });
  }
});
