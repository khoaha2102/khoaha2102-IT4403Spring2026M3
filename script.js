const ITEMS_PER_PAGE = 10;
const MAX_RESULTS = 50;

let allResults = [];
let currentPage = 1;

const BOOKSHELF_USER_ID = "0EkpzaYpVk8lJNNCBw37gg";
const TARGET_SHELF_NAME = "milestone 3";

$(document).ready(function () {
  $("#searchBtn").on("click", function () {
    performSearch();
  });

  $("#searchInput").on("keypress", function (e) {
    if (e.which === 13) {
      performSearch();
    }
  });

  loadBookshelfCollection();
});

function performSearch() {
  const keyword = $("#searchInput").val().trim();

  if (!keyword) {
    $("#searchMessage").text("Please enter a keyword first.");
    $("#results").empty();
    $("#pagination").empty();
    return;
  }

  $("#searchMessage").text("Loading search results...");
  $("#results").empty();
  $("#pagination").empty();

  $.getJSON("https://www.googleapis.com/books/v1/volumes", {
    q: keyword,
    maxResults: 40,
    startIndex: 0
  })
    .done(function (firstResponse) {
      $.getJSON("https://www.googleapis.com/books/v1/volumes", {
        q: keyword,
        maxResults: 10,
        startIndex: 40
      })
        .done(function (secondResponse) {
          const firstItems = firstResponse.items || [];
          const secondItems = secondResponse.items || [];

          allResults = firstItems.concat(secondItems).slice(0, MAX_RESULTS);
          currentPage = 1;

          if (allResults.length === 0) {
            $("#searchMessage").text("No books found for that keyword.");
            $("#results").empty();
            $("#pagination").empty();
            return;
          }

          $("#searchMessage").text(
            "Showing up to 50 search results. Click a book to view details."
          );

          renderPage(currentPage);
          renderPagination();
        })
        .fail(function () {
          $("#searchMessage").text(
            "Could not load the second set of results. Please try again."
          );
        });
    })
    .fail(function () {
      $("#searchMessage").text("Search request failed. Please try again later.");
    });
}

function renderPage(pageNumber) {
  const start = (pageNumber - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageItems = allResults.slice(start, end);

  $("#results").empty();

  pageItems.forEach(function (book) {
    const card = createBookCard(book, true);
    $("#results").append(card);
  });
}

function renderPagination() {
  $("#pagination").empty();
  const totalPages = Math.ceil(allResults.length / ITEMS_PER_PAGE);

  for (let i = 1; i <= totalPages; i++) {
    const button = $("<button></button>")
      .addClass("page-btn")
      .toggleClass("active", i === currentPage)
      .text(i)
      .on("click", function () {
        currentPage = i;
        renderPage(currentPage);
        renderPagination();
      });

    $("#pagination").append(button);
  }
}

function createBookCard(book, fromSearch) {
  const volume = book.volumeInfo || {};
  const title = volume.title || "No title available";
  const authors = volume.authors ? volume.authors.join(", ") : "Unknown author";
  const image =
    volume.imageLinks?.thumbnail ||
    "https://via.placeholder.com/120x180?text=No+Cover";

  return $("<div></div>")
    .addClass("book-card")
    .append($("<img>").attr("src", image).attr("alt", title))
    .append($("<h3></h3>").text(title))
    .append($("<p></p>").text(authors))
    .on("click", function () {
      showDetails(book, fromSearch ? "Search Result" : "Bookshelf Collection");
    });
}

function showDetails(book, sourceLabel) {
  const volume = book.volumeInfo || {};
  const title = volume.title || "No title available";
  const authors = volume.authors ? volume.authors.join(", ") : "Unknown author";
  const description = volume.description || "No description available.";
  const publisher = volume.publisher || "Unknown publisher";
  const publishedDate = volume.publishedDate || "Unknown date";
  const categories = volume.categories
    ? volume.categories.join(", ")
    : "No category listed";
  const pageCount = volume.pageCount || "N/A";
  const image =
    volume.imageLinks?.thumbnail ||
    "https://via.placeholder.com/160x240?text=No+Cover";
  const infoLink = volume.infoLink || "#";

  $("#detailsContent").html(`
    <img src="${image}" alt="${title}">
    <h3>${title}</h3>
    <p class="detail-meta"><strong>Author(s):</strong> ${authors}</p>
    <p class="detail-meta"><strong>Publisher:</strong> ${publisher}</p>
    <p class="detail-meta"><strong>Published Date:</strong> ${publishedDate}</p>
    <p class="detail-meta"><strong>Categories:</strong> ${categories}</p>
    <p class="detail-meta"><strong>Page Count:</strong> ${pageCount}</p>
    <p class="detail-meta"><strong>Source:</strong> ${sourceLabel}</p>
    <p>${description}</p>
    <p><a href="${infoLink}" target="_blank">View on Google Books</a></p>
  `);
}

function loadBookshelfCollection() {
  $("#collectionMessage").text("Loading public bookshelf collection...");

  $.getJSON(
    `https://www.googleapis.com/books/v1/users/${BOOKSHELF_USER_ID}/bookshelves`
  )
    .done(function (shelfResponse) {
      const shelves = shelfResponse.items || [];

      const matchingShelf = shelves.find(function (shelf) {
        return (
          shelf.title &&
          shelf.title.toLowerCase().trim() === TARGET_SHELF_NAME.toLowerCase().trim()
        );
      });

      if (!matchingShelf) {
        $("#collectionMessage").text(
          `Could not find a public bookshelf named "${TARGET_SHELF_NAME}".`
        );
        return;
      }

      const shelfId = matchingShelf.id;

      $.getJSON(
        `https://www.googleapis.com/books/v1/users/${BOOKSHELF_USER_ID}/bookshelves/${shelfId}/volumes`,
        {
          maxResults: 12,
          startIndex: 0
        }
      )
        .done(function (volumeResponse) {
          const items = volumeResponse.items || [];
          $("#collection").empty();

          if (items.length === 0) {
            $("#collectionMessage").text("This public bookshelf is empty.");
            return;
          }

          $("#collectionMessage").text(
            `Showing books from public bookshelf: ${matchingShelf.title}`
          );

          items.forEach(function (book) {
            const card = createBookCard(book, false);
            $("#collection").append(card);
          });
        })
        .fail(function () {
          $("#collectionMessage").text(
            "Found the bookshelf, but could not load its books."
          );
        });
    })
    .fail(function () {
      $("#collectionMessage").text(
        "Could not load public bookshelves for this user."
      );
    });
}
