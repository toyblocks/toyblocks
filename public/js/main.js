$(function() {
  $('#buildings').sortable({
    revert: true
  });
  var serialized = $('#buildings').sortable("toArray");
  $('#submit').click(function() {
    var serialized = $("#buildings").sortable("serialize", {
      key: "buildingid"
    });
    $.post('/sortbuildings', serialized, function(data) {
      $('#content').append('<div data-dismiss="alert" class="alert alert-info alert-dismissable">' + data + '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button></div>');
    });
  })
});