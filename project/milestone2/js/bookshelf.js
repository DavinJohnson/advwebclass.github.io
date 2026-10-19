// My Bookshelf: Work IDs of the books I picked. Titles and covers are loaded from Open Library.

var BOOKSHELF_IDS = [
  "OL45804W",    // Fantastic Mr Fox
  "OL82563W",    // Harry Potter and the Philosopher's Stone
  "OL27448W",    // The Lord of the Rings
  "OL17422847W", // Python For Data Analysis
  "OL5735363W"   // The Hunger Games
];

$(function () {
  setStatus("Loading your bookshelf…", "");

  // One request per book; a failed lookup is kept as { failed: true } so one bad ID can't hide the rest.
  var requests = BOOKSHELF_IDS.map(function (id) {
    return fetchJSON(OL_BASE + "/works/" + id + ".json")
      .then(function (work) {
        return { id: id, title: work.title || "Untitled", coverId: firstValidCover(work.covers) };
      })
      .catch(function () {
        return { id: id, failed: true };
      });
  });

  Promise.all(requests).then(showShelf);
});

function showShelf(books) {
  var $shelf = $("#shelf").empty();
  var loaded = 0;

  for (var i = 0; i < books.length; i++) {
    if (books[i].failed) {
      $shelf.append($("<li>").addClass("book-card failed").text("Couldn't load book " + books[i].id + "."));
    } else {
      $shelf.append(makeBookCard(books[i], "M"));
      loaded++;
    }
  }

  if (loaded === 0) {
    setStatus("We couldn't reach Open Library, so your bookshelf can't be shown. Check your connection and refresh the page.", "error");
  } else if (loaded < books.length) {
    setStatus("Some books on your shelf couldn't be loaded. Refresh the page to try again.", "error");
  } else {
    setStatus(books.length + " books on your shelf.", "");
  }
}
