App.details = (function ($, api, render, config, state) {
  var $section, $content;
  var activeId = null;
  var cache = {};

  function init() {
    $section = $("#details-section");
    $content = $("#details-content");
    showMessage("Select a book from the search results or the collection to see its details here.", "muted");
  }

  function show(book) {
    if (book.id === activeId) { return; }

    activeId = book.id;
    state.selectedId = book.id;
    render.markSelected(book.id);
    revealOnSmallScreens();

    if (cache[book.id]) {
      showBook(book, cache[book.id]);
      return;
    }

    showMessage("Loading details for “" + book.title + "”…", "status");

    var work = api.getWork(book.id);
    var ratings = api.getRatings(book.id).then(function (data) { return data; }, function () { return null; });

    $.when(work, ratings)
      .done(function (workResponse, ratingsData) {
        if (activeId !== book.id) { return; }
        cache[book.id] = { work: workResponse[0], ratings: ratingsData };
        showBook(book, cache[book.id]);
      })
      .fail(function (xhr, textStatus) {
        if (activeId !== book.id) { return; }
        activeId = null;
        showError(book, xhr.status, textStatus);
      });
  }

  function showMessage(text, type) {
    $content.html(render.fill("details-message", { text: text, muted: type === "muted", status: type === "status" }));
  }

  function showError(book, httpStatus, textStatus) {
    var message = httpStatus === 404
      ? "Open Library has no record for this book (Work ID " + book.id + ")."
      : render.failureMessage(textStatus) + " The details for “" + book.title + "” could not be loaded.";

    $content.html(render.fill("details-message", { text: message, error: true }));
    render.addRetry($content.find(".status"), function () { show(book); });
  }

  function getDescription(work) {
    var description = work.description;
    if (typeof description === "string") { return description; }
    if (description && typeof description.value === "string") { return description.value; }
    return "";
  }

  function firstValidCover(covers) {
    for (var i = 0; i < (covers || []).length; i++) {
      if (covers[i] > 0) { return covers[i]; }
    }
    return null;
  }

  function addFact(facts, label, value) {
    if (value) { facts.push({ label: label, value: String(value) }); }
  }

  function showBook(book, data) {
    var work = data.work;
    var coverId = firstValidCover(work.covers) || book.coverId;
    var author = render.joinAuthors(book.authors);

    var rating = data.ratings && data.ratings.summary && data.ratings.summary.count > 0
      ? render.ratingText({ rating: data.ratings.summary.average, ratingCount: data.ratings.summary.count })
      : render.ratingText(book);

    var facts = [];
    addFact(facts, "First published", work.first_publish_date || book.year);
    addFact(facts, "Editions", book.editions);
    addFact(facts, "Rating", rating || "Not rated yet");
    addFact(facts, "Languages", render.languageText(book.languages));
    addFact(facts, "Work ID", book.id);

    var subjects = $.grep(work.subjects || [], function (subject) {
      return typeof subject === "string" && subject !== "";
    }).slice(0, config.MAX_SUBJECTS);

    $content.html(render.fill("details", {
      title: work.title || book.title,
      authorLine: author ? "by " + author : "Author information is not available.",
      coverUrl: coverId ? api.coverUrl(coverId, "L") : "",
      facts: facts,
      description: $.trim(getDescription(work)),
      hasSubjects: subjects.length > 0,
      subjects: subjects,
      link: api.workPageUrl(book.id)
    }));
    render.showCoverFallbacks($content);
    revealOnSmallScreens();
  }

  function revealOnSmallScreens() {
    if (!window.matchMedia("(max-width: 860px)").matches) { return; }
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    $section[0].scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }

  return { init: init, show: show };
}(jQuery, App.api, App.render, App.config, App.state));
