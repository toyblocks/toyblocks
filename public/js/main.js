/* add functions to jquery */
jQuery.fn.extend({
  duplicateAfter: function (resetInputs) {
    var $obj = this.clone();
    if (resetInputs) {
      $obj.resetFormElement();
    }
    this.after($obj);
  },
  resetFormElement: function () {
    this.find('input').val('');
    if (this.data('image-preview')) {
      this.find(this.data('image-preview')).empty();
    }
  },

  /* all credit for highlight goes to: http://johannburkard.de/ */
  highlight: function (c) {
    function e(b, c) {
      var d = 0;
      if (3 == b.nodeType) {
        var a = b.data.toUpperCase().indexOf(c);
        a = a - (b.data.substr(0, a).toUpperCase().length - b.data.substr(0, a).length);
        if (0 <= a) {
          d = document.createElement("span"); d.className = "highlight"; a = b.splitText(a); a.splitText(c.length);
          var f = a.cloneNode(!0); d.appendChild(f); a.parentNode.replaceChild(d, a); d = 1
        }
      }
      else if (1 == b.nodeType && b.childNodes && !/(script|style)/i.test(b.tagName))
        for (var a = 0; a < b.childNodes.length; ++a)a += e(b.childNodes[a], c); return d
    }
    return this.length && c && c.length ? this.each(function () { e(this, c.toUpperCase()) }) : this
  }
});

/* form elements */
$(function () {
  /* pagination, search, sort and filter call this
      function to refresh the page */
  function refreshPage() {
    $.get(location.href,
      {
        page: pageNumber,
        search: searchQuery,
        filter: filterQuery.filter,
        filterkey: filterQuery.filterkey,
        sort: sortQuery.sort,
        sortdirection: sortQuery.sortdirection
      },
      function (data) {

        /* display the new content */
        $('#content').html(data);
        /* TODO: push the state into the window history, so back buttons work after search */
        /* window.history.pushState({"html":data,"pageTitle":"yo","",window.location.href}); */

        /* if page is beyond the current max, reset.
            content is empty anyway */
        if (window._pageCounter < pageNumber) {
          pageNumber = window._pageCounter;
          refreshPage();
          return;
        }

        /* highlight the search if there is any */
        if (searchQuery != '') {
          $('#content').highlight($searchInput.val());
        }

        /* update pagination */
        $('#page_selection').bootpag({
          total: window._pageCounter,
          page: pageNumber,
          maxVisible: 10
        });

        /* replace pagination text if in encyclopedia */
        if (window.location.pathname === "/encyclopedia") {
          replacePaginationText();
        }
      });
  }
  $('body').on('change', 'form input[type=file]', function (event) {
    var $formGroup = $(this).parents('.form-group'),
      $hiddenInput = $(event.target).next('input[type=hidden]');

    if (event.target.files && event.target.files.length) {
      var fileReader = new FileReader();
      fileReader.onload = function (e) {
        $hiddenInput.val(e.target.result);

        if ($formGroup.data('image-preview')) {

          var $container = $formGroup.find($formGroup.data('image-preview')),
            $img = $('<img>');
          $img.attr('src', e.target.result);
          $container.empty().append($img);
        }
      };
      fileReader.readAsDataURL(event.target.files[0]);
    }
  });

  /* initilize pagination, search, sort and filter */
  if (window['_paginationPages']) {

    var pageNumber = 1,
      searchQuery = '',
      filterQuery = '',
      sortQuery = '';

    /* Pagination */
    $('#page_selection').bootpag({
      total: window._pageCounter || 1,
      page: 1,
      maxVisible: 10
    }).on('page', function (event, num) {
      pageNumber = num;
      refreshPage();
    });

    /* Search */
    var $searchInput = $('<input type="text" name="search" placeholder="Suchen nach..." class="form-control"></div>'),
      $searchInputWrapper = $('<div id="search_input"></div>'),
      searchEvent;
    $searchInput.on('keyup', function () {
      clearTimeout(searchEvent);
      searchEvent = setTimeout(function () {
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
            searchParams.search = { title: $searchInput.val() };
          }
        }
        searchQuery = searchParams.search;

        refreshPage();
      }, 300);
    });

    /* Filter */
    $('.filterbutton').on("click", function (e) {
      e.preventDefault();

      var filterParams = {};
      filterParams.filter = {};
      filterParams.filterkey = {};
      filterParams.filterkey = this.dataset.key;
      filterParams.filter = this.dataset.query;

      filterQuery = filterParams;
      refreshPage();
    });

    /* Sort */
    $('.sortbutton').on("click", function (e) {
      e.preventDefault();

      var sortDirection = 1;
      var sortParams = {};
      var currentSortQuery = this.dataset.query;
      sortParams.sort = currentSortQuery;
      if (sortQuery != currentSortQuery) {
        sortDirection = 1;
      } else {
        sortDirection = -sortDirection;
      }
      sortQuery = currentSortQuery;
      sortParams.sortdirection = sortDirection;

      sortQuery = sortParams;
      refreshPage();
    });

    /* add the HTML to the webpage */
    $searchInputWrapper.append($searchInput);
    $('#search-bar').append($searchInputWrapper);

    /* replace pagination text if in encyclopedia */
    if (window.location.pathname === "/encyclopedia") {
      replacePaginationText();
    }
  }

  $(document).ready(function () {
    /* object references selection for objects */
    var $objecttypeTrigger;
    $('#objectFormModal').on('click', '.select-objecttype', function () {
      $objecttypeTrigger = $(this);
    });
    $('body').on('shown.bs.modal', '#objectTypesModal', function () {
      var $modal = $(this);
      $modal.on('click', '.select-object', function () {
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
      $('#enumsList').on('click', '.delete-enum', function () {
        $(this).parents('li').remove();
      });
      $(this).find('#addNewEnum').click(function () {
        var $input = $('#newEnumValue'),
          newValue = $input.val();
        $('#enumsList').append('<li class="list-group-item">' +
          newValue + '<input type="hidden" name="enums[]" value="' +
          newValue + '" /><span class="badge delete-enum"><span class="red glyphicon glyphicon-remove"></span></span></li>');
        $input.val('');
      });
      $(this).find('#saveEnums').click(function () {
        var serialized = $('#enumsForm').serialize();
        $.post('save-enums', serialized, function () {
          $modal.modal('hide');
        });
      });
    });

    /* disable modal caching */
    $('body').on('hidden.bs.modal',
      '#objectFormModal, #objectTypesModal, #enumsModal',
      function () {
        $(this).removeData('bs.modal');
      });
  });

  var referencesResolve = function () {
    $('[data-object-references]').not('.loaded').each(function () {
      var $this = $(this);
      $this.addClass('loaded');
      $.get(
        '/admin/objects/references',
        { type: $this.data('object-type'), ids: $this.data('object-references') },
        function (data) {
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

  $(document).ajaxSuccess(function () {
    referencesResolve();
  });

  referencesResolve();
});


/* set last-updated */
$.get('/index/lastupdate', function (data) {
  $('#last-update').append(data.lastupdate);
}, 'json');