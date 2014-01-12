
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

  jQuery.fn.extend({
    duplicateAfter: function(resetInputs) {
      var obj = this.clone();
      if (resetInputs)
        obj.find('input').val('');
      this.after(obj);
    }
  });
});
