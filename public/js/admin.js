
$(function(){
  var initSummernote = function() {
    $('.summernote').not('.loaded').summernote({
      disableDragAndDrop: true,
      height: 500,
      toolbar: [
        ['style', ['style']],
        ['font', ['bold', 'italic', 'underline', 'clear']],
        /* ['fontname', ['fontname']], */
        /* ['fontsize', ['fontsize']], */
        ['color', ['color']],
        ['para', ['ul', 'ol', 'paragraph']],
        /* ['height', ['height']], */
        ['table', ['table']],
        ['insert', ['link', 'picture', 'video']],
        ['view', ['fullscreen', 'codeview']],
        ['help', ['help']]
      ]
    }).addClass('loaded');
  };

  $(document).ready(function(){
      initSummernote();
  }); 
});