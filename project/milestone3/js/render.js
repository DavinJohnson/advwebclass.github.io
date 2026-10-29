App.render = (function ($, api) {

  function cover(coverId, size, title) {
    var $cover = $("<div>").addClass("cover cover-" + size);

    function showFallback() {
      $cover.empty().addClass("cover-missing").append($("<span>").text("No cover available"));
    }

    if (!coverId) {
      showFallback();
      return $cover;
    }

    $("<img>")
      .on("error", showFallback)
      .attr({ src: api.coverUrl(coverId, size), alt: "Cover of " + title, loading: "lazy" })
      .appendTo($cover);

    return $cover;
  }

  function firstValidCover(covers) {
    if (!Array.isArray(covers)) { return null; }
    for (var i = 0; i < covers.length; i++) {
      if (covers[i] > 0) { return covers[i]; }
    }
    return null;
  }

  function joinAuthors(names) {
    if (!Array.isArray(names) || names.length === 0) { return ""; }
    var shown = names.slice(0, 3).join(", ");
    return names.length > 3 ? shown + " and others" : shown;
  }

  function bookCard(book) {
    var $info = $("<div>").addClass("book-info")
      .append($("<button>").attr("type", "button").addClass("book-title").text(book.title))
      .append($("<p>").addClass("book-author").text(book.author ? "by " + book.author : "Author not listed"));

    return $("<li>")
      .addClass("book-card")
      .attr("data-work-id", book.id)
      .data("book", book)
      .append(cover(book.coverId, "S", book.title))
      .append($info);
  }

  function markSelected(workId) {
    $(".book-card").removeClass("selected").find(".book-title").removeAttr("aria-current");
    if (workId) {
      $('.book-card[data-work-id="' + workId + '"]')
        .addClass("selected")
        .find(".book-title").attr("aria-current", "true");
    }
  }

  function setStatus($status, text, type) {
    $status.toggleClass("error", type === "error").text(text);
  }

  function addRetry($status, onClick) {
    $("<button>").attr("type", "button").addClass("retry").text("Try again").on("click", onClick).appendTo($status);
  }

  function failureMessage(textStatus) {
    return textStatus === "timeout"
      ? "Open Library took too long to respond."
      : "We couldn't reach Open Library. Check your connection.";
  }

  return {
    cover: cover,
    firstValidCover: firstValidCover,
    joinAuthors: joinAuthors,
    bookCard: bookCard,
    markSelected: markSelected,
    setStatus: setStatus,
    addRetry: addRetry,
    failureMessage: failureMessage
  };
}(jQuery, App.api));
