// API的 URL 變化規則都很類似，因為大多參考了 RESTful 的風格，所以這邊我們拆分
const BASE_URL = "https://movie-list.alphacamp.io";
const INDEX_URL = BASE_URL + "/api/v1/movies/";
const POSTER_URL = BASE_URL + "/posters/";
//可用下列console.log觀察了解response了甚麼
///shift + alt + a
/* axios
  .get(INDEX_URL) // 修改這裡
  .then((response) => {
    console.log(response);
    console.log(response.data);
    console.log(response.data.results);
  })
  .catch((err) => console.log(err)); */

const dataPanel = document.querySelector("#data-panel");

const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-input");

const paginator = document.querySelector("#paginator");
const MOVIES_PER_PAGE = 12; //0-11, 12-23, 24-35...

// const 代表我們希望 movies 的內容維持不變。需要用 movies.push() 的方式把資料放進去
const movies = [];
let filteredMovies = [];

//函式:顯示電影卡
function renderMovieList(data) {
  let rawHTML = "";
  data.forEach((item) => {
    rawHTML += `
      <div class="col-sm-3">
          <div class="mt-2 mb-2">
            <!-- 上面有設定大小排版了 style屬性就可以拿掉 -->
            <div class="card">
              <img
                src="${POSTER_URL + item.image}"
                class="card-img-top"
                alt="Movie Poster"
              />
              <div class="card-body">
                <h5 class="card-title">${item.title}</h5>
              </div>
              <!-- 在card搜尋footer -->
              <div class="card-footer">
                <!-- 自行新增class:btn-show-movie方便之後DOM運作，用id的話只會設定到一個 -->
                <!-- 要記得加上modal來trigger -->
                <!-- data-bs-toggle 我們指定接下來要使用 modal 的形式，而 data-bs-target 則定義了互動的目標元件是哪個id  #movie-modal -->
                <button
                  type="button"
                  class="btn btn-primary btn-show-movie"
                  data-bs-toggle="modal"
                  data-bs-target="#movie-modal"
                  data-id="${item.id}"
                >
                  More
                </button>
                <button type="button" class="btn btn-info btn-add-favorite" data-id="${
                  item.id
                }">
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
  });
  dataPanel.innerHTML = rawHTML; //注意，必須在forEach外面，才能避免remove時沒有立即刪除
}

//事件:於電影卡的2個按鈕 顯示和喜愛
dataPanel.addEventListener("click", function onPanelClick(event) {
  if (event.target.matches(".btn-show-movie")) {
    showMovieModal(event.target.dataset.id);
  } else if (event.target.matches(".btn-add-favorite")) {
    addToFavorite(Number(event.target.dataset.id));
  }
});

//函式:顯示modal資訊
function showMovieModal(id) {
  const modalTitle = document.querySelector("#movie-modal-title");
  const modalImage = document.querySelector("#movie-modal-image");
  const modalDate = document.querySelector("#movie-modal-date");
  const modalDescription = document.querySelector("#movie-modal-description");
  axios
    .get(INDEX_URL + id)
    .then((response) => {
      const data = response.data.results;
      modalTitle.innerText = data.title;
      modalImage.innerHTML = `<img src="${
        POSTER_URL + data.image
      }" alt="movie-poster" class="img-fluid">`;
      modalDate.innerText = `Release Date: ${data.release_date}`;
      modalDescription.innerText = data.description;
    })
    .catch((err) => console.log(err));
}

//函式:加入喜愛
function addToFavorite(id) {
  const favoriteList = JSON.parse(localStorage.getItem("favoriteMovies")) || []; //將JSON格式的字串轉回為物件陣列，若沒GET到(null)則設為空陣列
  const movie = movies.find((movie) => movie.id === id); //把這movie {id:1,title:...}抓出來
  if (favoriteList.some((movie) => movie.id === id)) {
    //至少有一個存在，則回傳true
    return alert("此電影已經在收藏清單中！"); //若沒return的話，函式不會終止，會繼續後面的push，所以必須return
  }
  favoriteList.push(movie);
  localStorage.setItem("favoriteMovies", JSON.stringify(favoriteList)); //轉為JSON格式的字串，存入資料
}

//事件:於搜尋  顯示搜尋結果及警告
searchForm.addEventListener("submit", function onSearchFormSubmitted(event) {
  event.preventDefault();
  // let filteredMovies = []; 移去全域變數
  const keyword = searchInput.value.trim().toLowerCase();

  if (!keyword.length) {
    return alert("Please enter valid string!");
  }

  filteredMovies = movies.filter((movie) =>
    movie.title.toLowerCase().includes(keyword)
  );

  if (filteredMovies.length === 0) {
    return alert(`您輸入的關鍵字：${keyword} 沒有符合條件的電影`);
  }
  //搜尋完，先顯示搜尋結果的第一頁
  renderMovieList(getMoviesByPage(1));
  renderPaginator(filteredMovies.length);
});

//函式:顯示各頁要取哪幾個資料資訊
function getMoviesByPage(page) {
  const data = filteredMovies.length ? filteredMovies : movies;
  const startIndex = (page - 1) * MOVIES_PER_PAGE;
  //slice(含,不含)
  return data.slice(startIndex, startIndex + MOVIES_PER_PAGE);
}

//函式:顯示分頁數
function renderPaginator(amount) {
  const numberOfPage = Math.ceil(amount / MOVIES_PER_PAGE);
  let rawPageHTML = "";
  for (let page = 1; page <= numberOfPage; page++) {
    rawPageHTML += `<li class="page-item"><a class="page-link" href="#" data-page="${page}">${page}</a></li>`;
  }
  paginator.innerHTML = rawPageHTML;
}

//事件:於分頁器 顯示各分頁的搜尋結果
paginator.addEventListener("click", function onPaginatorClicked(event) {
  //如果被點擊的不是 <a> 標籤，結束。 tagName一律回傳大寫
  if (event.target.tagName !== "A") return;
  //它是字串，保險起見轉Number
  const page = Number(event.target.dataset.page);
  renderMovieList(getMoviesByPage(page));
});

// send request to index api
axios
  .get(INDEX_URL)
  .then((response) => {
    movies.push(...response.data.results);
    renderPaginator(movies.length);
    renderMovieList(getMoviesByPage(1));
  })
  .catch((err) => console.log(err));
