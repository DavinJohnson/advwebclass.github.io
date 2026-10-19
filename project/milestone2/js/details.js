// Book Details: look up one work by the Work ID in the URL (book.html?id=OL45804W).

var MAX_SUBJECTS = 10;

$(function () {
  var workId = $.trim(new URLSearchParams(window.location.search).get("id") || "").toUpperCase();

  // Use the browser's Back when we arrived from this site, so the earlier search or shelf is restored.
  $("#back-link").on("click", function (event) {
    var cameFromSite = document.referrer && new URL(document.referrer).origin === window.location.origin;
    if (cameFromSite && history.length > 1) {
      event.preventDefault();
      history.back();
    }
  });

  if (!isWorkId(workId)) {
    setStatus("No book was selected. Search for a book on the Home page and choose one of the results.", "error");
    return;
  }

  setStatus("Loading book details…", "");

  fetchJSON(OL_BASE + "/works/" + workId + ".json")
    .then(function (work) { showBook(work, workId); })
    .catch(function (error) {
      if (error.status === 404) {
        setStatus("Open Library has no book with Work ID " + workId + ".", "error");
      } else {
        setStatus("We couldn't load this book. Check your connection and refresh the page.", "error");
      }
    });
});

// Descriptions come back either as plain text or as { type, value }.
function getDescription(work) {
  var description = work.description;
  if (typeof description === "string") { return description; }
  if (description && typeof description.value === "string") { return description.value; }
  return "";
}

function showBook(work, workId) {
  var title = work.title || "Untitled";
  document.title = title + " – Book Finder";

  $("#book-title").text(title);
  $("#work-id").text(workId);
  $("#cover").append(makeCover(firstValidCover(work.covers), "M", title));
  $("#open-library-link").attr("href", OL_BASE + "/works/" + workId);

  var description = $.trim(getDescription(work));
  if (description) {
    $("#description").text(description);
  } else {
    $("#description").addClass("muted").text("No description is available for this book.");
  }

  var subjects = Array.isArray(work.subjects) ? work.subjects.slice(0, MAX_SUBJECTS) : [];
  if (subjects.length === 0) {
    $("#subjects").replaceWith($("<p>").addClass("muted").text("No subjects are listed for this book."));
  }
  for (var i = 0; i < subjects.length; i++) {
    $("#subjects").append($("<li>").text(subjects[i]));
  }

  setStatus("", "");
  $("#book").prop("hidden", false);
}
