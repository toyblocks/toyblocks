/* add highlight function to jquery for search highlighting */
jQuery.fn.highlight=function(c){function e(b,c){var d=0;if(3==b.nodeType){var a=b.data.toUpperCase().indexOf(c),a=a-(b.data.substr(0,a).toUpperCase().length-b.data.substr(0,a).length);if(0<=a){d=document.createElement("span");d.className="highlight";a=b.splitText(a);a.splitText(c.length);var f=a.cloneNode(!0);d.appendChild(f);a.parentNode.replaceChild(d,a);d=1}}else if(1==b.nodeType&&b.childNodes&&!/(script|style)/i.test(b.tagName))for(a=0;a<b.childNodes.length;++a)a+=e(b.childNodes[a],c);return d} return this.length&&c&&c.length?this.each(function(){e(this,c.toUpperCase())}):this};
jQuery.fn.removeHighlight=function(){return this.find("span.highlight").each(function(){this.parentNode.firstChild.nodeName;with(this.parentNode)replaceChild(this.firstChild,this),normalize()}).end()};
/* all credit goes to: http://johannburkard.de/blog/programming/javascript/highlight-javascript-text-higlighting-jquery-plugin.html */

/* form elements */
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


  /* init bootpag */
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
    /* Search */
    var $searchInput = $('<input type="text" name="search" placeholder="Suchen nach..." class="form-control"></div>'),
      $searchInputWrapper = $('<div id="search_input"></div>'),
      searchEvent;
    $searchInput.on('keyup', function(event) {
      clearTimeout(searchEvent);
      searchEvent = setTimeout(function(){
        var searchParams = {},
          inputValue = $searchInput.val();
        if (inputValue) {
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
          if(inputValue != ''){
            $('#content').highlight(inputValue);
          }
        });
      }, 500);
    });
    /* Filter */
    
    
    $('.filterbutton').click(function(e) {
      e.preventDefault();

      var filterParams = {};
      filterParams.filter = {};
      filterParams.filterkey = {};
      filterParams.filterkey = this.dataset.key;
      filterParams.filter = this.dataset.query;

      $.get(location.href, filterParams, function(data) {
        $('#content').html(data);
      });
    });

    var sortDirection = {};
    $('.sortbutton').click(function(e) {
      e.preventDefault();

      var sortParams = {};
      var sortquery = this.dataset.query;
      sortParams.sort = sortquery;
      if(sortDirection[sortquery] === undefined){
        sortDirection[sortquery] = 1;
      }else{
        sortDirection[sortquery] = -sortDirection[sortquery];
      }
      console.log(sortDirection[sortquery]);
      sortParams.sortdirection = sortDirection[sortquery];

      console.log(sortParams.sortdirection);
      
      $.get(location.href, sortParams, function(data) {
        $('#content').html(data);
      });
    });

    //$filterInputWrapper.append($filterInput);
    //$('#filter-bar').append($filterInputWrapper);
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

  $(document).ready(function(){

    /* object references selection for objects */
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

    /* disable modal caching */
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
  });

  referencesResolve();
});


/* set last-updated */
$.get( '/index/lastupdate', function( data ) {
  $('#last-update').append(data.lastupdate);
}, 'json');