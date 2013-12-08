$(function() {
    $('.drag').draggable({ snap: '.container', snapMode: 'inner' });
    $('.container').droppable({
      drop: function( event, ui ) {
        $('#result').css('background-color', 'green');;
      }
    });
  });

// form elements
$(function(){
  var $form = $('body').find('form');
  $form.on('change', 'input[type=file]', function(event) {
    var $hiddenInput = $(event.target).next('input[type=hidden]');
    if (event.target.files && event.target.files.length) {
      var fileReader = new FileReader();
      fileReader.onload = function(e) {
        $hiddenInput.val(e.target.result);
      };
      fileReader.readAsDataURL(event.target.files[0]);
    }
  });
});