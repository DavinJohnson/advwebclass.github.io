App.render = (function ($, api, state) {
  var cache = {};

  var LANGUAGES = {
    eng: "English", spa: "Spanish", fre: "French", ger: "German", ita: "Italian",
    por: "Portuguese", rus: "Russian", jpn: "Japanese", chi: "Chinese", dut: "Dutch",
    pol: "Polish", tur: "Turkish", kor: "Korean", ara: "Arabic", swe: "Swedish"
  };

  function template(name) {
    if (!cache[name]) {
      cache[name] = $("#tpl-" + name).html();
      Mustache.parse(cache[name]);
    }
    return cache[name];
  }

  function fill(name, view) {
    return Mustache.render(template(name), view, {
      card: template("book-card"),
      missing: template("cover-missing")
    });
  }

  function joinAuthors(names) {
    if (!names || names.length === 0) { return ""; }
    var shown = names.slice(0, 3).join(", ");
    return names.length > 3 ? shown + " and others" : shown;
  }

  function ratingText(book) {
    if (!book.rating) { return ""; }
    return book.rating.toFixed(1) + " / 5 (" + book.ratingCount.toLocaleString() + " ratings)";
  }

  function languageText(codes) {
    var names = $.map(codes || [], function (code) { return LANGUAGES[code] || null; });
    return names.slice(0, 5).join(", ");
  }

  function cardView(book) {
    var meta = [];
    if (book.year) { meta.push(book.year); }
    if (book.rating) { meta.push("★ " + book.rating.toFixed(1)); }

    var author = joinAuthors(book.authors);
    return {
      id: book.id,
      title: book.title,
      authorLine: author ? "by " + author : "Author not listed",
      coverUrl: book.coverId ? api.coverUrl(book.coverId, "M") : "",
      meta: meta.join(" · ")
    };
  }

  function showCoverFallbacks($root) {
    $root.find("img").one("error", function () {
      $(this).closest(".cover").replaceWith(fill("cover-missing", {}));
    });
  }

  function showBooks($list, books) {
    $.each(books, function (_, book) { state.books[book.id] = book; });
    $list.html(fill("book-list", { books: $.map(books, cardView) }));
    showCoverFallbacks($list);
    markSelected(state.selectedId);
  }

  function markSelected(workId) {
    $(".book-card").removeClass("selected").find(".book-title").removeAttr("aria-current");
    if (workId) {
      $('.book-card[data-work-id="' + workId + '"]')
        .addClass("selected")
        .find(".book-title").attr("aria-current", "true");
    }
  }

  function setLayout(layout) {
    state.layout = layout;
    $(".book-list").removeClass("grid list").addClass(layout);
    $(".layout-btn").each(function () {
      $(this).attr("aria-pressed", $(this).attr("data-layout") === layout ? "true" : "false");
    });
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
    fill: fill,
    joinAuthors: joinAuthors,
    ratingText: ratingText,
    languageText: languageText,
    showBooks: showBooks,
    showCoverFallbacks: showCoverFallbacks,
    markSelected: markSelected,
    setLayout: setLayout,
    setStatus: setStatus,
    addRetry: addRetry,
    failureMessage: failureMessage
  };
}(jQuery, App.api, App.state));
