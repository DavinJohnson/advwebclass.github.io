App.collection = (function ($, api, render, details, config) {
  var $section, $status, $list;
  var loading = false;

  function init() {
    $section = $("#collection-section");
    $status = $("#collection-status");
    $list = $("#collection-list");

    $list.on("click", ".book-card", function () { details.show($(this).data("book")); });
    load();
  }

  function load() {
    if (loading) { return; }
    loading = true;

    $list.empty();
    $section.attr("aria-busy", "true");
    render.setStatus($status, "Loading the " + config.COLLECTION.label + " collection…", "");

    api.getSubject(config.COLLECTION.slug, config.COLLECTION_SIZE)
      .done(onLoaded)
      .fail(function (xhr, textStatus) { showUnavailable(render.failureMessage(textStatus), true); })
      .always(function () {
        loading = false;
        $section.attr("aria-busy", "false");
      });
  }

  function onLoaded(data) {
    var books = [];

    $.each(data.works || [], function (_, work) {
      var id = api.workIdFromKey(work.key);
      if (!id) { return; }
      books.push({
        id: id,
        title: work.title || "Untitled",
        author: render.joinAuthors($.map(work.authors || [], function (author) { return author.name; })),
        coverId: work.cover_id || null
      });
    });

    if (books.length === 0) {
      showUnavailable("The " + config.COLLECTION.label + " collection has no books to show right now.", true);
      return;
    }

    $.each(books.slice(0, config.COLLECTION_SIZE), function (_, book) { $list.append(render.bookCard(book)); });
    render.markSelected(App.state.selectedId);
    render.setStatus($status, "Top " + $list.children().length + " books filed under the “" +
      config.COLLECTION.label + "” subject on Open Library.", "");
  }

  function showUnavailable(text, canRetry) {
    render.setStatus($status, text + " The collection is unavailable.", "error");
    if (canRetry) { render.addRetry($status, load); }
  }

  return { init: init };
}(jQuery, App.api, App.render, App.details, App.config));
