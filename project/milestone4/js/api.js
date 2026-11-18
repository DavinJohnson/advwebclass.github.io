App.api = (function ($) {
  var API_BASE = "https://openlibrary.org";
  var COVER_BASE = "https://covers.openlibrary.org/b/id/";
  var TIMEOUT_MS = 20000;
  var FIELDS = "key,title,author_name,cover_i,first_publish_year,edition_count,language,ratings_average,ratings_count";

  function getJSON(url, params) {
    return $.ajax({
      url: url,
      type: "GET",
      dataType: "json",
      data: params,
      timeout: TIMEOUT_MS
    });
  }

  function workIdFromKey(key) {
    var match = /^\/works\/(OL\d+W)$/.exec(String(key || ""));
    return match ? match[1] : "";
  }

  function toBook(doc) {
    var id = workIdFromKey(doc.key);
    if (!id) { return null; }
    return {
      id: id,
      title: doc.title || "Untitled",
      authors: doc.author_name || [],
      coverId: doc.cover_i || doc.cover_id || null,
      year: doc.first_publish_year || null,
      editions: doc.edition_count || null,
      languages: doc.language || [],
      rating: doc.ratings_average || null,
      ratingCount: doc.ratings_count || 0
    };
  }

  function toSubjectBook(work) {
    var book = toBook(work);
    if (book) {
      book.authors = $.map(work.authors || [], function (author) { return author.name; });
    }
    return book;
  }

  return {
    searchBooks: function (term, limit) {
      return getJSON(API_BASE + "/search.json", { q: term, limit: limit, fields: FIELDS });
    },

    getTrending: function (limit) {
      return getJSON(API_BASE + "/trending/weekly.json", { limit: limit });
    },

    getTopRated: function (limit) {
      return getJSON(API_BASE + "/search.json", {
        q: "ratings_count:[100 TO *]",
        sort: "rating",
        limit: limit,
        fields: FIELDS
      });
    },

    getSubject: function (slug, limit) {
      return getJSON(API_BASE + "/subjects/" + slug + ".json", { limit: limit });
    },

    getWork: function (workId) {
      return getJSON(API_BASE + "/works/" + workId + ".json");
    },

    getRatings: function (workId) {
      return getJSON(API_BASE + "/works/" + workId + "/ratings.json");
    },

    toBook: toBook,
    toSubjectBook: toSubjectBook,

    coverUrl: function (coverId, size) {
      return COVER_BASE + coverId + "-" + size + ".jpg";
    },

    workPageUrl: function (workId) {
      return API_BASE + "/works/" + workId;
    }
  };
}(jQuery));
