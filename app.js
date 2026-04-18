const FAVORITES_STORAGE_KEY = "rick-and-morty-favorites";

function parsePageValue(value) {
  const page = Number.parseInt(value, 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function readFavoriteIds() {
  try {
    const storedValue = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!storedValue) {
      return [];
    }

    const parsedValue = JSON.parse(storedValue);
    return Array.isArray(parsedValue)
      ? parsedValue.filter((item) => Number.isInteger(item))
      : [];
  } catch (error) {
    console.error("Unable to read favorites from localStorage.", error);
    return [];
  }
}

function parseUrlFilters() {
  const searchParams = new URLSearchParams(window.location.search);

  return {
    page: parsePageValue(searchParams.get("page")),
    name: searchParams.get("name") ?? "",
    status: searchParams.get("status") ?? "",
    gender: searchParams.get("gender") ?? "",
    species: searchParams.get("species") ?? ""
  };
}

function rickAndMortyExplorer() {
  return {
    apiUrl: "https://rickandmortyapi.com/api/character",
    characters: [],
    featuredCharacter: null,
    selectedCharacter: null,
    loading: false,
    hasLoaded: false,
    error: "",
    favoriteIds: readFavoriteIds(),
    skeletonCards: [1, 2, 3, 4, 5, 6],
    statusOptions: [
      { value: "", label: "Todos" },
      { value: "alive", label: "Alive" },
      { value: "dead", label: "Dead" },
      { value: "unknown", label: "Unknown" }
    ],
    genderOptions: [
      { value: "", label: "Todos" },
      { value: "female", label: "Female" },
      { value: "male", label: "Male" },
      { value: "genderless", label: "Genderless" },
      { value: "unknown", label: "Unknown" }
    ],
    filters: {
      name: "",
      status: "",
      gender: "",
      species: ""
    },
    pagination: {
      current: 1,
      total: 1,
      count: 0
    },
    onPopState: null,

    init() {
      this.restoreStateFromUrl();
      this.onPopState = () => {
        this.restoreStateFromUrl();
        this.fetchCharacters({ syncUrl: false });
      };

      window.addEventListener("popstate", this.onPopState);
      this.fetchCharacters({ syncUrl: false });
    },

    destroy() {
      if (this.onPopState) {
        window.removeEventListener("popstate", this.onPopState);
      }
    },

    get favoriteCount() {
      return this.favoriteIds.length;
    },

    get hasActiveFilters() {
      return Boolean(
        this.filters.name.trim() ||
          this.filters.status ||
          this.filters.gender ||
          this.filters.species.trim()
      );
    },

    get activeFilterCount() {
      return [
        this.filters.name.trim(),
        this.filters.status,
        this.filters.gender,
        this.filters.species.trim()
      ].filter(Boolean).length;
    },

    get visiblePages() {
      const maxVisiblePages = 5;
      const totalPages = Math.max(this.pagination.total, 1);
      const currentPage = Math.min(this.pagination.current, totalPages);
      const halfWindow = Math.floor(maxVisiblePages / 2);
      let startPage = Math.max(1, currentPage - halfWindow);
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }

      return Array.from(
        { length: endPage - startPage + 1 },
        (_, index) => startPage + index
      );
    },

    get resultsRangeLabel() {
      if (!this.characters.length) {
        return this.hasLoaded ? "Sin resultados" : "Esperando datos";
      }

      const firstItem = (this.pagination.current - 1) * 20 + 1;
      const lastItem = firstItem + this.characters.length - 1;
      return `${firstItem}-${lastItem} de ${this.pagination.count}`;
    },

    restoreStateFromUrl() {
      const urlState = parseUrlFilters();
      this.pagination.current = urlState.page;
      this.filters.name = urlState.name;
      this.filters.status = urlState.status;
      this.filters.gender = urlState.gender;
      this.filters.species = urlState.species;
    },

    syncUrl() {
      const searchParams = new URLSearchParams();

      if (this.pagination.current > 1) {
        searchParams.set("page", String(this.pagination.current));
      }

      if (this.filters.name.trim()) {
        searchParams.set("name", this.filters.name.trim());
      }

      if (this.filters.status) {
        searchParams.set("status", this.filters.status);
      }

      if (this.filters.gender) {
        searchParams.set("gender", this.filters.gender);
      }

      if (this.filters.species.trim()) {
        searchParams.set("species", this.filters.species.trim());
      }

      const nextUrl = searchParams.toString()
        ? `${window.location.pathname}?${searchParams.toString()}`
        : window.location.pathname;

      window.history.replaceState({}, "", nextUrl);
    },

    persistFavorites() {
      try {
        window.localStorage.setItem(
          FAVORITES_STORAGE_KEY,
          JSON.stringify(this.favoriteIds)
        );
      } catch (error) {
        console.error("Unable to save favorites in localStorage.", error);
      }
    },

    isFavorite(characterId) {
      return this.favoriteIds.includes(characterId);
    },

    favoriteButtonTone(characterId) {
      return this.isFavorite(characterId) ? "favorite-active" : "favorite-idle";
    },

    statusTone(status) {
      switch ((status || "").toLowerCase()) {
        case "alive":
          return "status-alive";
        case "dead":
          return "status-dead";
        default:
          return "status-unknown";
      }
    },

    selectedOptionLabel(options, value) {
      const selectedOption = options.find((option) => option.value === value);
      return selectedOption?.label ?? "Todos";
    },

    setFeaturedCharacter(character) {
      this.featuredCharacter = character;
    },

    refreshFeaturedCharacter() {
      const favoriteCharacter = this.characters.find((character) =>
        this.favoriteIds.includes(character.id)
      );
      const aliveCharacter = this.characters.find(
        (character) => character.status === "Alive"
      );

      this.featuredCharacter =
        favoriteCharacter ?? aliveCharacter ?? this.characters[0] ?? null;
    },

    toggleFavorite(characterId) {
      if (this.isFavorite(characterId)) {
        this.favoriteIds = this.favoriteIds.filter((item) => item !== characterId);
      } else {
        this.favoriteIds = [...this.favoriteIds, characterId];
      }

      this.persistFavorites();
      this.refreshFeaturedCharacter();
    },

    openCharacter(character) {
      this.selectedCharacter = character;
    },

    closeCharacter() {
      this.selectedCharacter = null;
    },

    buildRequestUrl() {
      const requestUrl = new URL(this.apiUrl);
      requestUrl.searchParams.set("page", String(this.pagination.current));

      if (this.filters.name.trim()) {
        requestUrl.searchParams.set("name", this.filters.name.trim());
      }

      if (this.filters.status) {
        requestUrl.searchParams.set("status", this.filters.status);
      }

      if (this.filters.gender) {
        requestUrl.searchParams.set("gender", this.filters.gender);
      }

      if (this.filters.species.trim()) {
        requestUrl.searchParams.set("species", this.filters.species.trim());
      }

      return requestUrl.toString();
    },

    async fetchCharacters({ syncUrl = true } = {}) {
      this.loading = true;
      this.error = "";

      try {
        const response = await fetch(this.buildRequestUrl());

        if (response.status === 404) {
          this.characters = [];
          this.pagination.total = 1;
          this.pagination.count = 0;
          this.featuredCharacter = null;
          this.closeCharacter();
          this.hasLoaded = true;

          if (syncUrl) {
            this.syncUrl();
          }

          return;
        }

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const payload = await response.json();
        this.characters = Array.isArray(payload.results) ? payload.results : [];
        this.pagination.total = payload.info?.pages ?? 1;
        this.pagination.count = payload.info?.count ?? this.characters.length;
        this.refreshFeaturedCharacter();
        this.hasLoaded = true;

        if (syncUrl) {
          this.syncUrl();
        }
      } catch (error) {
        console.error("Unable to fetch characters.", error);
        this.error =
          "No fue posible cargar los personajes en este momento. Intenta de nuevo en un momento.";
        this.characters = [];
        this.pagination.total = 1;
        this.pagination.count = 0;
        this.featuredCharacter = null;
        this.hasLoaded = true;
        this.closeCharacter();
      } finally {
        this.loading = false;
      }
    },

    applyFilters() {
      this.pagination.current = 1;
      this.fetchCharacters();
    },

    clearFilters() {
      this.filters.name = "";
      this.filters.status = "";
      this.filters.gender = "";
      this.filters.species = "";
      this.pagination.current = 1;
      this.fetchCharacters();
    },

    refreshResults() {
      this.fetchCharacters();
    },

    goToPage(page) {
      if (this.loading || page === this.pagination.current) {
        return;
      }

      this.pagination.current = page;
      this.fetchCharacters();
    },

    nextPage() {
      if (this.loading || this.pagination.current >= this.pagination.total) {
        return;
      }

      this.pagination.current += 1;
      this.fetchCharacters();
    },

    previousPage() {
      if (this.loading || this.pagination.current <= 1) {
        return;
      }

      this.pagination.current -= 1;
      this.fetchCharacters();
    }
  };
}

window.rickAndMortyExplorer = rickAndMortyExplorer;

if (window.Alpine) {
  window.Alpine.data("rickAndMortyExplorer", rickAndMortyExplorer);
} else {
  document.addEventListener("alpine:init", () => {
    Alpine.data("rickAndMortyExplorer", rickAndMortyExplorer);
  });
}
