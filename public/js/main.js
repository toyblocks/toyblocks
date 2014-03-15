
// form elements
$(function(){
  $('body').on('change', 'form input[type=file]', function(event) {
    var $fileInput = $(this),
      $formGroup = $(this).parents('.form-group'),
      $hiddenInput = $(event.target).next('input[type=hidden]');
    if (event.target.files && event.target.files.length) {
      var fileReader = new FileReader();
      fileReader.onload = function(e) {
        $hiddenInput.val(e.target.result);
        if ($formGroup.data('image-preview')) {
          var $container = $formGroup
            .find($formGroup.data('image-preview')),
            $img = $('<img>');
          $img.attr('src', e.target.result);
          $container
            .empty()
            .append($img);
        }
      };
      fileReader.readAsDataURL(event.target.files[0]);
    }
  });



  jQuery.fn.extend({
    duplicateAfter: function(resetInputs) {
      var $obj = this.clone();
      if (resetInputs) {
        $obj.resetFormElement();
      }
      this.after($obj);
    },
    resetFormElement: function() {
      this.find('input').val('');
      if (this.data('image-preview')) {
        this.find(this.data('image-preview')).empty();
      }
    },
    removeFormElement: function() {
      var $formGroup = $(this).parents('.form-group'),
        $form = $formGroup.parents('form');

    }
  });
});


// set last-updated
$.get( '/index/lastupdate', function( data ) {
  $('#last-update').append(data.lastupdate);
}, 'json');
