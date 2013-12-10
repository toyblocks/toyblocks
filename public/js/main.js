$(function() {
  $('#buildings').sortable({
    revert: true
  });
  var serialized = $('#buildings').sortable('toArray');
  $('#submit').click(function() {
    var serialized = $("#buildings").sortable("serialize", {
      key: "buildingid"
    });
    $.post('/validateorder', serialized, function(data) {
      $('#content').append('<div data-dismiss="alert" class="alert alert-info alert-dismissable">'
        + data + '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button></div>');
    });
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