var App = {

  config: {
    PAGE_SIZE: 10,
    MAX_RESULTS: 50,
    MAX_TERM_LENGTH: 100,
    MAX_SUBJECTS: 10,
    COLLECTION_SIZE: 10,
    COLLECTION: { slug: "science_fiction", label: "Science Fiction" }
  },

  state: {
    term: "",
    results: [],
    totalMatches: 0,
    page: 1,
    selectedId: null
  }
};
