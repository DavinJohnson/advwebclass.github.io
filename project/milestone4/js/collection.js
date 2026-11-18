App.collection = (function ($, api, render, details, config, state) {
  var $section, $status, $list, $picker;
  var books = {};
  var activeKey = null;

  var sources = {
    popular: function () {
      return api.getTrending(config.COLLECTION_SIZE).then(function (data) {
        return $.map(data.works || [], api.toBook);
      });
    },
    top: function () {
      return api.getTopRated(config.COLLECTION_SIZE).then(function (data) {
        return $.map(data.docs || [], api.toBook);
      });
    },
    scifi: function () {
      return api.getSubject("science_fiction", config.COLLECTION_SIZE).then(function (data) {
        return $.map(data.works || [], api.toSubjectBook);
      });
    }
  };

  function init() {
    $section = $("#panel-collection");
    $status = $("#collection-status");
    $list = $("#collection-list");
    $picker = $("#collection-picker");

    $picker.on("click", "button", function () { select($(this).attr("data-collection")); });
    $list.on("click", ".book-card", function () { details.show(state.books[$(this).attr("data-work-id")]); });
    select(config.COLLECTIONS[0].key);
  }

  function find(key) {
    return $.grep(config.COLLECTIONS, function (item) { return item.key === key; })[0];
  }

  function showPicker() {
    var hadFocus = $picker.find("button:focus").length > 0;
    $picker.html(render.fill("collection-picker", {
      options: $.map(config.COLLECTIONS, function (item) {
        return { key: item.key, label: item.label, active: item.key === activeKey };
      })
    }));
    if (hadFocus) { $picker.find("[data-collection='" + activeKey + "']").trigger("focus"); }
  }

  function select(key) {
    activeKey = key;
    showPicker();

    if (books[key]) {
      show(key);
      return;
    }
    load(key);
  }

  function load(key) {
    $list.empty();
    $section.attr("aria-busy", "true");
    render.setStatus($status, "Loading " + find(key).label + "…", "");

    sources[key]()
      .done(function (loaded) {
        books[key] = loaded;
        if (activeKey === key) { show(key); }
      })
      .fail(function (xhr, textStatus) {
        if (activeKey === key) { showUnavailable(key, render.failureMessage(textStatus)); }
      })
      .always(function () {
        if (activeKey === key) { $section.attr("aria-busy", "false"); }
      });
  }

  function show(key) {
    var item = find(key);
    if (books[key].length === 0) {
      $list.empty();
      render.setStatus($status, "There are no books to show for " + item.label + " right now.", "");
      return;
    }
    render.showBooks($list, books[key]);
    render.setStatus($status, item.about + " Showing " + books[key].length + " books.", "");
  }

  function showUnavailable(key, text) {
    render.setStatus($status, text + " " + find(key).label + " is unavailable.", "error");
    render.addRetry($status, function () { load(key); });
  }

  return { init: init };
}(jQuery, App.api, App.render, App.details, App.config, App.state));
