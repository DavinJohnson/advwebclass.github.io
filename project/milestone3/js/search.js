App.search = (function ($, api, render, details, config, state) {
  var $section, $form, $input, $button, $message, $status, $list, $pager;
  var busy = false;

  function init() {
    $section = $("#results-section");
    $form = $("#search-form");
    $input = $("#search-input");
    $button = $("#search-button");
    $message = $("#search-message");
    $status = $("#results-status");
    $list = $("#results-list");
    $pager = $("#pager");

    $form.on("submit", onSubmit);
    $input.on("input", clearInputError);
    $list.on("click", ".book-card", function () { details.show($(this).data("book")); });
    $pager.on("click", "button", onPagerClick);
  }


  function validate(rawValue) {
    var term = $.trim(rawValue).replace(/\s+/g, " ");

    if (term === "") {
      return { error: "Please enter a title or keywords to search." };
    }
    if (term.length > config.MAX_TERM_LENGTH) {
      return { error: "Please use " + config.MAX_TERM_LENGTH + " characters or fewer." };
    }
    if (!/[\p{L}\p{N}]/u.test(term)) {
      return { error: "Please include at least one letter or number in your search." };
    }
    return { term: term };
  }

  function showInputError(text) {
    $message.text(text);
    $input.attr("aria-invalid", "true");
  }

  function clearInputError() {
    $message.text("");
    $input.removeAttr("aria-invalid");
  }


  function onSubmit(event) {
    event.preventDefault();
    if (busy) { return; }

    var result = validate($input.val());
    if (result.error) {
      showInputError(result.error);
      $input.trigger("focus");
      return;
    }

    clearInputError();
    $input.val(result.term);
    runSearch(result.term);
  }

  function setBusy(isBusy) {
    busy = isBusy;
    $button.prop("disabled", isBusy).text(isBusy ? "Searching…" : "Search");
    $section.attr("aria-busy", isBusy ? "true" : "false");
  }

  function runSearch(term) {
    state.term = term;
    state.results = [];
    state.totalMatches = 0;
    state.page = 1;
    $list.empty();
    $pager.prop("hidden", true).empty();
    render.setStatus($status, "Searching Open Library for “" + term + "”…", "");

    setBusy(true);
    api.searchBooks(term, config.MAX_RESULTS)
      .done(onResults)
      .fail(function (xhr, textStatus) { onFailure(term, textStatus); })
      .always(function () { setBusy(false); });
  }

  function onResults(data) {
    var books = [];

    $.each(data.docs || [], function (_, doc) {
      var id = api.workIdFromKey(doc.key);
      if (!id) { return; }
      books.push({
        id: id,
        title: doc.title || "Untitled",
        author: render.joinAuthors(doc.author_name),
        coverId: doc.cover_i || null
      });
    });

    state.results = books.slice(0, config.MAX_RESULTS);
    state.totalMatches = data.numFound || 0;

    if (state.results.length === 0) {
      render.setStatus($status, "No books found for “" + state.term + "”. Try different keywords or check the spelling.", "");
      return;
    }

    buildPager(Math.ceil(state.results.length / config.PAGE_SIZE));
    showPage(1);
  }

  function onFailure(term, textStatus) {
    render.setStatus($status, render.failureMessage(textStatus) + " Your search for “" + term + "” did not finish.", "error");
    render.addRetry($status, function () { if (!busy) { runSearch(term); } });
  }


  function buildPager(totalPages) {
    var $numbers = $("<span>").addClass("pager-numbers");
    for (var p = 1; p <= totalPages; p++) {
      $numbers.append($("<button>").attr({ type: "button", "data-page": p, "aria-label": "Page " + p }).text(p));
    }

    $pager.empty()
      .append($("<p>").addClass("pager-label").attr("data-role", "label"))
      .append($("<div>").addClass("pager-buttons")
        .append($("<button>").attr({ type: "button", "data-page": "prev" }).text("‹ Previous"))
        .append($numbers)
        .append($("<button>").attr({ type: "button", "data-page": "next" }).text("Next ›")))
      .prop("hidden", false);
  }

  function onPagerClick() {
    var target = $(this).attr("data-page");
    var page = target === "prev" ? state.page - 1 : target === "next" ? state.page + 1 : parseInt(target, 10);
    if (page === state.page) { return; }

    showPage(page);
    keepResultsInView();
  }

  function showPage(page) {
    var totalPages = Math.ceil(state.results.length / config.PAGE_SIZE);
    state.page = Math.min(Math.max(page, 1), totalPages);

    var start = (state.page - 1) * config.PAGE_SIZE;
    var view = state.results.slice(start, start + config.PAGE_SIZE);

    $list.empty();
    $.each(view, function (_, book) { $list.append(render.bookCard(book)); });
    render.markSelected(state.selectedId);

    var message = "Showing " + (start + 1) + "–" + (start + view.length) + " of " + state.results.length +
      " results for “" + state.term + "”";
    if (state.totalMatches > state.results.length) {
      message += " (" + state.totalMatches.toLocaleString() + " matches in total; up to " +
        config.MAX_RESULTS + " are loaded here)";
    }
    render.setStatus($status, message, "");

    updatePager(totalPages);
  }

  function updatePager(totalPages) {
    $pager.find("[data-role='label']").text("Page " + state.page + " of " + totalPages);
    $pager.find(".pager-numbers button").each(function () {
      var isCurrent = parseInt($(this).attr("data-page"), 10) === state.page;
      $(this).toggleClass("current", isCurrent);
      if (isCurrent) { $(this).attr("aria-current", "page"); } else { $(this).removeAttr("aria-current"); }
    });
    $pager.find("[data-page='prev']").prop("disabled", state.page === 1);
    $pager.find("[data-page='next']").prop("disabled", state.page === totalPages);
  }

  function keepResultsInView() {
    if ($status[0].getBoundingClientRect().top < 0) {
      $status[0].scrollIntoView({ block: "start" });
    }
  }

  return { init: init };
}(jQuery, App.api, App.render, App.details, App.config, App.state));
