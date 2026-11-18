App.search = (function ($, api, render, details, view, config, state) {
  var $section, $form, $input, $button, $message, $status, $list, $pager;
  var busy = false;

  function init() {
    $section = $("#panel-results");
    $form = $("#search-form");
    $input = $("#search-input");
    $button = $("#search-button");
    $message = $("#search-message");
    $status = $("#results-status");
    $list = $("#results-list");
    $pager = $("#pager");

    $form.on("submit", onSubmit);
    $input.on("input", clearInputError);
    $list.on("click", ".book-card", function () { details.show(state.books[$(this).attr("data-work-id")]); });
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
    view.selectTab("results");
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
    state.results = $.map(data.docs || [], api.toBook).slice(0, config.MAX_RESULTS);
    state.totalMatches = data.numFound || 0;

    if (state.results.length === 0) {
      render.setStatus($status, "No books found for “" + state.term + "”. Try different keywords or check the spelling.", "");
      return;
    }

    showPage(1);
  }

  function onFailure(term, textStatus) {
    render.setStatus($status, render.failureMessage(textStatus) + " Your search for “" + term + "” did not finish.", "error");
    render.addRetry($status, function () { if (!busy) { runSearch(term); } });
  }

  function onPagerClick() {
    var target = $(this).attr("data-page");
    var page = target === "prev" ? state.page - 1 : target === "next" ? state.page + 1 : parseInt(target, 10);
    if (page === state.page) { return; }

    showPage(page);
    $pager.find("[data-page='" + target + "']:not(:disabled)").add($pager.find(".current")).first().trigger("focus");
    keepResultsInView();
  }

  function showPage(page) {
    var totalPages = Math.ceil(state.results.length / config.PAGE_SIZE);
    state.page = Math.min(Math.max(page, 1), totalPages);

    var start = (state.page - 1) * config.PAGE_SIZE;
    var books = state.results.slice(start, start + config.PAGE_SIZE);

    render.showBooks($list, books);

    var message = "Showing " + (start + 1) + "–" + (start + books.length) + " of " + state.results.length +
      " results for “" + state.term + "”";
    if (state.totalMatches > state.results.length) {
      message += " (" + state.totalMatches.toLocaleString() + " matches in total; up to " +
        config.MAX_RESULTS + " are loaded here)";
    }
    render.setStatus($status, message, "");

    showPager(totalPages);
  }

  function showPager(totalPages) {
    var pages = [];
    for (var n = 1; n <= totalPages; n++) {
      pages.push({ n: n, current: n === state.page });
    }

    $pager.html(render.fill("pager", {
      page: state.page,
      totalPages: totalPages,
      onFirst: state.page === 1,
      onLast: state.page === totalPages,
      pages: pages
    })).prop("hidden", false);
  }

  function keepResultsInView() {
    if ($status[0].getBoundingClientRect().top < 0) {
      $status[0].scrollIntoView({ block: "start" });
    }
  }

  return { init: init };
}(jQuery, App.api, App.render, App.details, App.view, App.config, App.state));
