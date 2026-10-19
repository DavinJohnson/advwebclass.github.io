// Book Search (Home): search Open Library, show up to 60 results, 10 per page.

var RESULTS_PER_PAGE = 10;
var MAX_RESULTS = 60;
var MAX_PAGES = MAX_RESULTS / RESULTS_PER_PAGE;

var currentTerm = "";
var latestRequest = 0; // lets us ignore responses from searches that were replaced

$(function () {
  // Restore a search from the URL (so Back from a details page returns to the same results).
  var params = new URLSearchParams(window.location.search);
  var term = $.trim(params.get("q") || "");
  if (term) {
    $("#search-input").val(term);
    runSearch(term, clampPage(parseInt(params.get("page"), 10)));
  }

  $("#search-form").on("submit", function (event) {
    event.preventDefault();
    var newTerm = $.trim($("#search-input").val());

    if (!newTerm) {
      latestRequest++;
      $("#results").empty();
      $("#pagination").prop("hidden", true);
      setStatus("Please enter a title, author, or keyword to search.", "error");
      return;
    }
    runSearch(newTerm, 1); // a new search always starts on page 1
  });

  // Changing the page re-uses the term of the last search, not whatever is typed in the box now.
  $("#page-select").on("change", function () {
    runSearch(currentTerm, parseInt($(this).val(), 10));
    window.scrollTo(0, 0);
  });
});

function clampPage(page) {
  if (isNaN(page) || page < 1) { return 1; }
  return Math.min(page, MAX_PAGES);
}

function runSearch(term, page) {
  currentTerm = term;
  var requestId = ++latestRequest;

  $("#results").empty();
  $("#pagination").prop("hidden", true);
  setStatus("Searching Open Library…", "");

  var url = OL_BASE + "/search.json" +
    "?q=" + encodeURIComponent(term) +
    "&limit=" + RESULTS_PER_PAGE +
    "&page=" + page +
    "&fields=key,title,author_name,cover_i";

  fetchJSON(url)
    .then(function (data) {
      if (requestId === latestRequest) { showResults(data, term, page); }
    })
    .catch(function () {
      if (requestId === latestRequest) { showSearchError(term, page); }
    });
}

function showResults(data, term, page) {
  var found = data.numFound || 0;
  var docs = data.docs || [];

  var available = Math.min(found, MAX_RESULTS);
  var totalPages = Math.ceil(available / RESULTS_PER_PAGE);

  // A page number from the URL can be past the last page of a small result set (docs comes back empty).
  if (found > 0 && page > totalPages) {
    runSearch(term, totalPages);
    return;
  }

  if (found === 0 || docs.length === 0) {
    setStatus("No books found for “" + term + "”. Try a different keyword or check the spelling.", "");
    return;
  }

  var $results = $("#results").empty();
  for (var i = 0; i < docs.length; i++) {
    var doc = docs[i];
    if (!doc.key) { continue; }

    $results.append(makeBookCard({
      id: workIdFromKey(doc.key),
      title: doc.title || "Untitled",
      author: doc.author_name ? doc.author_name[0] : "",
      coverId: doc.cover_i
    }, "S"));
  }

  var first = (page - 1) * RESULTS_PER_PAGE + 1;
  var last = first + docs.length - 1;
  var message = "Showing " + first + "–" + last + " of " + available + " results for “" + term + "”";
  if (found > MAX_RESULTS) {
    message += " (top " + MAX_RESULTS + " of " + found.toLocaleString() + " matches)";
  }
  setStatus(message, "");

  buildPagination(page, totalPages);
  history.replaceState(null, "", "?" + new URLSearchParams({ q: term, page: page }));
}

function buildPagination(page, totalPages) {
  if (totalPages <= 1) { return; }

  var $select = $("#page-select").empty();
  for (var p = 1; p <= totalPages; p++) {
    $select.append($("<option>").val(p).text(p));
  }
  $select.val(page);

  $("#page-total").text("of " + totalPages);
  $("#pagination").prop("hidden", false);
}

function showSearchError(term, page) {
  setStatus("We couldn't reach Open Library. Check your connection and try again.", "error");
  $("<button>")
    .attr("type", "button")
    .text("Try again")
    .on("click", function () { runSearch(term, page); })
    .appendTo("#status");
}
