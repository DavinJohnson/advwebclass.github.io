var App = {

  config: {
    PAGE_SIZE: 12,
    MAX_RESULTS: 60,
    MAX_TERM_LENGTH: 100,
    MAX_SUBJECTS: 10,
    COLLECTION_SIZE: 20,
    COLLECTIONS: [
      { key: "popular", label: "Popular this week", about: "The most popular books on Open Library this week." },
      { key: "top", label: "Top rated", about: "The highest rated books on Open Library (at least 100 ratings each)." },
      { key: "scifi", label: "Science Fiction", about: "Books filed under the Science Fiction subject on Open Library." }
    ]
  },

  state: {
    term: "",
    results: [],
    totalMatches: 0,
    page: 1,
    selectedId: null,
    layout: "grid",
    books: {}
  }
};
