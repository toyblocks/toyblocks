'use strict';

var GamesController = require('../Games'),
  Statistics = require('../moderation/Stats');

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
      title: 'Zeitstrahl'
    });
  },

/**
 * GET - This Method is used for the index page
 *
 * @return title - the title of the game
 * @return route - url route
 */
  helpAction: function() {
    this.view.render({
      title: 'Zeitstrahl'
    });
  },

/** GET - This renders the main game
 *
 * @return buildings - an array of buildings to display for the template
 */
  gameAction: function() {
    var _this = this,
      ids = _this.request.param('id'),
      level = parseInt(_this.request.param('level'),10),
      limit = parseInt(_this.request.param('limit'),10);

    //+ Jonas Raoni Soares Silva
    //@ http://jsfromhell.com/array/shuffle [v1.0]
    function shuffle(o){ //v1.0
      for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i),
       x = o[--i], o[i] = o[j], o[j] = x);
      return o;
    }

    _this.increaseStat('level'+level+'_count_played');
    if(typeof ids === 'undefined'){
      _this.renderGame(level, function(err, buildings){
        var buildingLimit = limit || 7;
        buildings = shuffle(buildings).slice(0,buildingLimit);
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
      };
      _this.mongodb
        .collection('sorting_buildings')
        .find({_id: {$in: ids}})
        .toArray(function (err, buildings) {
          buildings = shuffle(buildings);
          _this.view.render({
            title: 'Zeitstrahl',
            level: level,
            buildings: buildings
          });
        });
    }
  },

/** 
 * Gets the buildings from the database and returns it with a callback
 * 
 * @param countLimit     - count limit of buildings
 * @param renderCallback - the callback to call after we got the buildings
 * @param game           - information about the current game
 */
  renderGame: function(level, renderCallback) {
    if (level === 3) {

      // Only level 2 buildings
      this.mongodb
        .collection('sorting_buildings')
        .find({level: 2})
        .toArray(renderCallback);
    }else if (level === 2) {

      // Level 1 and level 2
      this.mongodb
        .collection('sorting_buildings')
        .find()
        .toArray(renderCallback);
    } else {

      // only level 1
      this.mongodb
        .collection('sorting_buildings')
        .find({level: 1})
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
      sortIds = _this.request.param('sortings'),
      level   = _this.request.param('level'),
      attempt = _this.request.param('attempt'),
      userId  = _this.request.session.user.tuid;

    //TODO: catch error on clientside
    if(sortIds === undefined){
      _this.response.json({
        error: 'Du hast keine Elemente sortiert, oder so?'
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

            for (var _id in sortedBuildings) {
              if (!sortedBuildings[_id]){ continue; }
              // go through all buildings and check index of era in era-array
              var buildingEraIndex = eras.indexOf(sortedBuildings[_id].era);
              orderNumbers.push(eras.indexOf(sortedBuildings[_id].era));
              if (buildingEraIndex < lastEraIndex)
                solutionIsCorrect = false;
              lastEraIndex = buildingEraIndex;
            }
            
            // Display which elements are on a wrong position
            var order = [],
              prepend,
              same;
            for (var i = 0; i < orderNumbers.length; i++) {
              same = prepend = 0;
              for (var j = 0; j < orderNumbers.length; j++) {
                if(orderNumbers[i] > orderNumbers[j])
                  prepend++;
                else if(orderNumbers[i] === orderNumbers[j])
                  same++;
              }
              order.push(prepend <= i && i <= (prepend + same - 1));
            }

            // Update Stats
            Statistics.prototype.insertStats(_this, 'sorting', _this.request.param('sortings').join(','), level, userId, attempt, solutionIsCorrect);

            // response with a json object
            _this.response.json({
              correct: solutionIsCorrect,
              order: order,
              orderNumbers: orderNumbers
            });
          });
      });
  }
});