App.details = (function ($, api, render, config, state) {
  var $section, $content;

  var cache = {};
  var activeId = null;
  var pending = null;

  function init() {
    $section = $("#details-section");
    $content = $("#details-content");
    showPlaceholder();
  }

  function show(book) {
    if (book.id === activeId) { return; }

    activeId = book.id;
    state.selectedId = book.id;
    render.markSelected(book.id);
    revealOnSmallScreens();

    if (pending) { pending.abort(); }

    if (cache[book.id]) {
      showBook(book, cache[book.id]);
      return;
    }

    showLoading(book);
    var request = api.getWork(book.id);
    pending = request;

    request
      .done(function (work) {
        cache[book.id] = work;
        showBook(book, work);
      })
      .fail(function (xhr, textStatus) {
        if (textStatus === "abort") { return; }
        activeId = null;
        showError(book, xhr.status, textStatus);
      })
      .always(function () {
        if (pending === request) { pending = null; }
      });
  }

  function showPlaceholder() {
    $content.empty().append(
      $("<p>").addClass("muted").text("Select a book from the search results or the collection to see its details here.")
    );
  }

  function showLoading(book) {
    $content.empty().append(
      $("<p>").addClass("status").text("Loading details for “" + book.title + "”…")
    );
  }

  function showError(book, httpStatus, textStatus) {
    var message = httpStatus === 404
      ? "Open Library has no record for this book (Work ID " + book.id + ")."
      : render.failureMessage(textStatus) + " The details for “" + book.title + "” could not be loaded.";

    var $status = $("<p>").addClass("status error").text(message);
    render.addRetry($status, function () { show(book); });
    $content.empty().append($status);
  }

  function getDescription(work) {
    var description = work.description;
    if (typeof description === "string") { return description; }
    if (description && typeof description.value === "string") { return description.value; }
    return "";
  }

  function labelled(heading, $body) {
    return $("<div>").addClass("details-block")
      .append($("<h4>").text(heading))
      .append($body);
  }

  function showBook(book, work) {
    var title = work.title || book.title;
    var coverId = render.firstValidCover(work.covers) || book.coverId;
    var description = $.trim(getDescription(work));
    var subjects = $.grep(Array.isArray(work.subjects) ? work.subjects : [], function (subject) {
      return typeof subject === "string" && subject !== "";
    }).slice(0, config.MAX_SUBJECTS);

    var $author = book.author
      ? $("<p>").addClass("details-author").text("by " + book.author)
      : $("<p>").addClass("muted").text("Author information is not available.");

    var $description = description
      ? $("<p>").addClass("description").text(description)
      : $("<p>").addClass("muted").text("No description is available for this book.");

    var $subjects;
    if (subjects.length > 0) {
      $subjects = $("<ul>").addClass("chips");
      $.each(subjects, function (_, subject) {
        $subjects.append($("<li>").text(subject));
      });
    } else {
      $subjects = $("<p>").addClass("muted").text("No subjects are listed for this book.");
    }

    var $link = $("<a>")
      .addClass("button")
      .attr({ href: api.workPageUrl(book.id), target: "_blank", rel: "noopener" })
      .text("View on Open Library");

    var $body = $("<div>").addClass("details-body")
      .append($("<h3>").addClass("details-title").text(title))
      .append($author)
      .append($("<dl>").addClass("facts")
        .append($("<dt>").text("Work ID"))
        .append($("<dd>").text(book.id)))
      .append(labelled("Description", $description))
      .append(labelled("Subjects", $subjects))
      .append($link);

    $content.empty().append(
      $("<article>").addClass("details-card")
        .append($("<div>").addClass("details-cover").append(render.cover(coverId, "M", title)))
        .append($body)
    );
  }

  function revealOnSmallScreens() {
    if (!window.matchMedia("(max-width: 860px)").matches) { return; }
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    $section[0].scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }

  return { init: init, show: show };
}(jQuery, App.api, App.render, App.config, App.state));
