
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


  // init bootpag
  if (window['_paginationPages']) {
    $('#page_selection').bootpag({
      total: window._paginationPages || 1,
      page: 1,
      maxVisible: 10
    }).on('page', function(event, num){
      $.get(location.href, {page: num}, function(data) {
        $('#content').html(data);
        $('#search_input input').val('');
      });
    });
    // Search
    var $searchInput = $('<input type="text" name="search" placeholder="Suchen nach..." class="form-control"></div>'),
      $searchInputWrapper = $('<div id="search_input"></div>'),
      searchEvent;
    $searchInput.on('keyup', function(event) {
      clearTimeout(searchEvent);
      searchEvent = setTimeout(function(){
        var searchParams = {};
        if ($searchInput.val()) {
          if (window._searchFields && window._searchFields.length > 0) {
            searchParams.search = {};
            for (var i = 0; i < window._searchFields.length; i++) {
              searchParams.search[window._searchFields[i]] = $searchInput.val();
            }
          }
          else {
            searchParams.search = {title: $searchInput.val()};
          }
        }
        $.get(location.href, searchParams, function(data) {
          $('#content').html(data);
        });
      }, 500);
    });
    // Filter
    
    var $filterInput = $(
'<div class="btn-group dropdown">' +
  '<button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-expanded="false">' +
    'Filter<span class="caret"></span>' +
  '</button>' +
  '<ul class="dropdown-menu" role="menu">' +
    '<li><b>Anzeigen</b></li>' +
    '<li><a href="#">Student</a></li>' +
    '<li><a href="#">Moderator</a></li>' +
    '<li><a href="#">Admin</a></li>' +
    '<li class="divider"></li>' +
    '<li><b>Sortieren nach</b></li>' +
    '<li><a href="#">Vornamen</a></li>' +
    '<li><a href="#">Nachnamen</a></li>' +
    '<li><a href="#">Nickname</a></li>' +
    '<li><a href="#">TU-ID</a></li>' +
  '</ul>' +
'</div>'),
      $filterInputWrapper = $('<div id="filter_input"></div>'),
      filterEvent;
    $filterInput.on('click', function(event) {
      clearTimeout(filterEvent);
      filterEvent = setTimeout(function(){
        console.log("FilterEvent started")
        var filterParams = {};
        if(window._filterFields && window._filterFields.length > 0){
          //add filtering
          console.log("event, filterfields")
        }
        if(window._sortFields && window._sortFields.length > 0){
          //add Sorting
          console.log("event, sortfields")
        }
        filterParams.filter = {student: 1};
        $.get(location.href, filterParams, function(data) {
          $('#content').html(data);
        });
      }, 500);
    });

    $filterInputWrapper.append($filterInput);
    $('#filter-bar').append($filterInputWrapper);
    $searchInputWrapper.append($searchInput);
    $('#search-bar').append($searchInputWrapper);
  }


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

  var initSummernote = function() {
    $('.summernote').not('.loaded').summernote({
      disableDragAndDrop: true,
      height: 200,
      toolbar: [
        ['style', ['style']],
        ['font', ['bold', 'italic', 'underline', 'clear']],
        // ['fontname', ['fontname']],
        // ['fontsize', ['fontsize']],
        ['color', ['color']],
        ['para', ['ul', 'ol', 'paragraph']],
        // ['height', ['height']],
        ['table', ['table']],
        ['insert', ['link', 'picture', 'video']],
        ['view', ['fullscreen', 'codeview']],
        ['help', ['help']]
      ]
    }).addClass('loaded');
  };

  $(document).ready(function(){
    initSummernote();

    // object references selection for objects
    var $objecttypeTrigger;
    $('#objectFormModal').on('click', '.select-objecttype', function() {
      $objecttypeTrigger = $(this);
    });
    $('body').on('shown.bs.modal', '#objectTypesModal', function () {
      var $modal = $(this);
      $modal.on('click', '.select-object', function(){
        $objecttypeTrigger.siblings('input').val($(this).data('object-id'));
        $objecttypeTrigger
          .removeClass('btn-default')
          .addClass('btn-success')
          .html($(this).parents('tr').children().first().html() +
            ' ausgewählt');
        $modal.modal('hide');
      });
    });

    $('body').on('shown.bs.modal', '#enumsModal', function () {
      var $modal = $(this);
      $(this).find('#enumsList').sortable();
      $(this).find('#enumsList').disableSelection();
      $('#enumsList').on('click', '.delete-enum', function(){
        $(this).parents('li').remove();
      });
      $(this).find('#addNewEnum').click(function(){
        var $input = $('#newEnumValue'),
          newValue = $input.val();
        $('#enumsList').append('<li class="list-group-item">' + newValue + '<input type="hidden" name="enums[]" value="' + newValue + '" /><span class="badge delete-enum"><span class="red glyphicon glyphicon-remove"></span></span></li>');
        $input.val('');
      });
      $(this).find('#saveEnums').click(function(){
        var serialized = $('#enumsForm').serialize();
        $.post('save-enums', serialized, function(data) {
          $modal.modal('hide');
        });
      });
    });

    // disable modal caching
    $('body').on('hidden.bs.modal',
      '#objectFormModal, #objectTypesModal, #enumsModal',
      function() {
        $(this).removeData('bs.modal');
      });
  });


  var referencesResolve = function() {
    $('[data-object-references]').not('.loaded').each(function(){
      var $this = $(this);
      $this.addClass('loaded');
      $.get(
        '/admin/objects/references',
        {type: $this.data('object-type'), ids: $this.data('object-references')},
        function( data ) {
          $this.html(data);
        }
      );
    });
  };

  $(document).popover({
    html: true,
    selector: 'img[data-content]',
    trigger: 'hover',
  });

  $(document).ajaxSuccess(function() {
    referencesResolve();
    initSummernote();
  });

  referencesResolve();
});


// set last-updated
$.get( '/index/lastupdate', function( data ) {
  $('#last-update').append(data.lastupdate);
}, 'json');

