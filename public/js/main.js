$(function() {
    $('.drag').draggable({ snap: '.container', snapMode: 'inner' });
    $('.container').droppable({
      drop: function( event, ui ) {
        $('#result').css('background-color', 'green');;
      }
    });
  });