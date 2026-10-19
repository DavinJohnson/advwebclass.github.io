// Shared helpers used by all three pages.

var OL_BASE = "https://openlibrary.org";
var COVER_BASE = "https://covers.openlibrary.org/b/id/";
var REQUEST_TIMEOUT_MS = 20000;

// GET a URL and parse the JSON. Rejects on network errors, timeouts, and non-2xx responses.
function fetchJSON(url) {
  var controller = new AbortController();
  var timer = setTimeout(function () { controller.abort(); }, REQUEST_TIMEOUT_MS);

  return fetch(url, { signal: controller.signal })
    .then(function (response) {
      if (!response.ok) {
        var error = new Error("HTTP " + response.status);
        error.status = response.status;
        throw error;
      }
      return response.json();
    })
    .finally(function () { clearTimeout(timer); });
}

// "/works/OL45804W" -> "OL45804W"
function workIdFromKey(key) {
  return String(key || "").replace("/works/", "");
}

function isWorkId(id) {
  return /^OL\d+W$/.test(id);
}

// Work records can list -1 as a placeholder cover, so take the first positive ID.
function firstValidCover(covers) {
  if (!Array.isArray(covers)) { return null; }
  for (var i = 0; i < covers.length; i++) {
    if (covers[i] > 0) { return covers[i]; }
  }
  return null;
}

function bookDetailsUrl(workId) {
  return "book.html?id=" + encodeURIComponent(workId);
}

// Cover image (size "S" or "M") with a text fallback when there is no cover or it fails to load.
function makeCover(coverId, size, title) {
  var $cover = $("<div>").addClass("cover cover-" + size);

  function showPlaceholder() {
    $cover.empty().addClass("cover-missing").append($("<span>").text("No cover available"));
  }

  if (!coverId) {
    showPlaceholder();
    return $cover;
  }

  $("<img>")
    .on("error", showPlaceholder)
    .attr({
      src: COVER_BASE + coverId + "-" + size + ".jpg",
      alt: "Cover of " + title,
      loading: "lazy"
    })
    .appendTo($cover);

  return $cover;
}

// One list item: cover + title linked to the details page (+ author when known).
function makeBookCard(book, coverSize) {
  var $info = $("<div>").addClass("book-info").append(
    $("<a>").addClass("book-title").attr("href", bookDetailsUrl(book.id)).text(book.title)
  );

  if (book.author) {
    $info.append($("<p>").addClass("book-author").text("by " + book.author));
  }

  return $("<li>").addClass("book-card")
    .append(makeCover(book.coverId, coverSize, book.title))
    .append($info);
}

// Writes into <p id="status">. type is "error" or "" (plain).
function setStatus(text, type) {
  $("#status").removeClass("error").addClass(type || "").text(text);
}
