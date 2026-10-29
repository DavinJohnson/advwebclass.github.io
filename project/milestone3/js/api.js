App.api = (function ($) {
  var API_BASE = "https://openlibrary.org";
  var COVER_BASE = "https://covers.openlibrary.org/b/id/";
  var TIMEOUT_MS = 20000;

  function getJSON(url, params) {
    return $.ajax({
      url: url,
      type: "GET",
      dataType: "json",
      data: params,
      timeout: TIMEOUT_MS
    });
  }

  return {
    searchBooks: function (term, limit) {
      return getJSON(API_BASE + "/search.json", {
        q: term,
        limit: limit,
        fields: "key,title,author_name,cover_i"
      });
    },

    getWork: function (workId) {
      return getJSON(API_BASE + "/works/" + workId + ".json");
    },

    getSubject: function (slug, limit) {
      return getJSON(API_BASE + "/subjects/" + slug + ".json", { limit: limit });
    },

    workIdFromKey: function (key) {
      var match = /^\/works\/(OL\d+W)$/.exec(String(key || ""));
      return match ? match[1] : "";
    },

    coverUrl: function (coverId, size) {
      return COVER_BASE + coverId + "-" + size + ".jpg";
    },

    workPageUrl: function (workId) {
      return API_BASE + "/works/" + workId;
    }
  };
}(jQuery));
