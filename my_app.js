import MyUI from './my_ui.js';

const baseURL = 'https://jsonplaceholder.typicode.com';
const show = document.querySelector('#btn-show');
const container = document.querySelector('.container');

const MAX_TEXT_LENGTH = 60;
const SCROLL_THRESHOLD = 150;
const POST_LIMIT = 12;

let page = 1;
let isLoading = false;
let hasMore = true;
let postsGrid = null;

let globalObserver = null;
let currentSearchController = null;

show.onclick = () => {
  // fetch(`${baseURL}/posts`)
  // .then(res => res.json())
  // .then(posts => {
  //   posts.forEach(post => displayPost(post));
  // })
  // .catch(err => console.error(err));

  show.classList.add('d-none');

  setupSearchUI();
  setupPostsLayout();

  // loadMorePosts( ()=> {
  setupInfiniteScroll();
  // });
};

function setupSearchUI() {
  const searchWrapper = MyUI.Tag('div', {className: 'mb-5 p-4 border rounded bg-light'});
  const searchTitle = MyUI.Tag('h4', {text: 'Find Post Author', className: 'mb-3'});

  const inputGroup = MyUI.Tag('div', {className: 'input-group mb-3'});
  const searchInput = MyUI.Input({
    type: 'number',
    placeholder: 'Enter post number (e.g., 1-100)',
    id: 'search-input'
  });

  const resultContainer = MyUI.Tag('div', {id: 'search-result', className: 'mt-3'});

  const searchBtn = MyUI.Button({
    text: 'Find Author',
    className: 'btn-secondary',
    onClick: () => {
      void handleSearch(searchInput.value, resultContainer);
      // searchInput.value = '';
    }
  });

  inputGroup.append(searchInput, searchBtn);
  searchWrapper.append(searchTitle, inputGroup, resultContainer);
  container.append(searchWrapper);
}

async function handleSearch(postId, resultEl) {
  if (currentSearchController) {
    currentSearchController.abort();
  }

  currentSearchController = new AbortController();
  const signal = currentSearchController.signal;

  resultEl.textContent = 'Loading...'

  if (!postId.trim()) {
    resultEl.textContent = ''
    const warning = MyUI.Tag('div', {text: 'Please enter a post ID.', className: 'alert alert-warning'});
    resultEl.append(warning);
    return;
  }

  try {
    const post = await fetchJSON(
      `${baseURL}/posts/${postId}`,
      {signal},
      'Post not found'
    );

    const user = await fetchJSON(
      `${baseURL}/users/${post.userId}`,
      {signal},
      'User data not found'
    );

    const successAlert = MyUI.Tag('div', {className: 'alert alert-success'});
    const infoText = MyUI.Tag('p', {
      text: `Author: ${user.name} | City: ${user.address.city}`,
      className: 'mb-0 fw-bold'
    });

    resultEl.textContent = '';
    successAlert.append(infoText);
    resultEl.append(successAlert);

  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn(`[Search] Transaction aborted for post ID: ${postId}.`);
      return;
    }

    console.error(err);

    const errorAlert = MyUI.Tag('div', {
      text: `Error: ${err.message || 'Something went wrong'}`,
      className: 'alert alert-danger'
    });

    resultEl.textContent = '';
    resultEl.append(errorAlert);
  }
}


function setupPostsLayout() {
  const feedTitle = MyUI.Tag('h2', {text: 'Posts Feed', className: 'mb-4'});
  postsGrid = MyUI.Tag('div', {className: 'row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4'});
  const sentinel = MyUI.Tag('div', {id: 'scroll-sentinel', className: 'text-center my-4 p-2'});
  container.append(feedTitle, postsGrid, sentinel);
}

async function loadMorePosts() {
  if (isLoading || !hasMore) return;
  isLoading = true;

  const sentinel = document.querySelector('#scroll-sentinel');
  if (sentinel) sentinel.textContent = 'Loading posts...';

  try {
    const posts = await fetchJSON(
      `${baseURL}/posts?_page=${page}&_limit=${POST_LIMIT}`,
      {},
      'Failed to fetch posts'
    );

    if (posts.length < POST_LIMIT) {
      hasMore = false;
      if (sentinel) sentinel.textContent = 'End of feed.';
    } else if (sentinel) {
      sentinel.textContent = '';
    }

    //a small cache for a heap of cards
    const fragment = document.createDocumentFragment();

    posts.forEach(post => {
      const cardCol = createPostCardElement(post);
      fragment.append(cardCol);
    });

    postsGrid.append(fragment);

    page++;

/*
*    //forgot that all the time what I use adaptive design ... :'-(
*    //here AI code with my bug fix
*
*    if (hasMore && sentinel) {
*      const rect = sentinel.getBoundingClientRect();
*      if ((rect.top - 150) < window.innerHeight) {
*        loadMorePosts();
*      }
*    }
*    test 2 ... I get it!!! Work!!!!- callback for the first run
*    ... with zoom in/out not :'-(((((
*    if (callback && typeof callback === 'function') {
*      callback();
*    }
*/

    // It's way too late! End of the circlejerk, everybody go to sleep.
    if (hasMore && sentinel && globalObserver) {
      globalObserver.unobserve(sentinel);
      globalObserver.observe(sentinel)
    }
  } catch (err) {
    console.error(err);
    if (sentinel) sentinel.textContent = 'Error loading feed. Scroll to retry.';
  } finally {
    isLoading = false;
  }
}

function createPostCardElement(post) {
  const col = MyUI.Tag('div', {className: 'col'});

  const isLongText = post.body.length > MAX_TEXT_LENGTH;
  const truncatedText = isLongText ? truncateText(post.body, MAX_TEXT_LENGTH) : post.body;

  const textContainer = MyUI.Tag('span', {text: truncatedText});
  const bodyWrapper = MyUI.Tag('p', {className: 'card-text flex-grow-1 mb-0'});

  bodyWrapper.append(textContainer);

  if (isLongText) {
    const toggleLink = MyUI.Tag('span', {
      text: ' Read more',
      className: 'text-primary fw-medium ms-1 cursor-pointer',
      role: 'button',
      onClick: function () {
        const isCollapsed = this.textContent === ' Read more';
        if (isCollapsed) {
          textContainer.textContent = post.body;
          this.textContent = ' Show less';
        } else {
          textContainer.textContent = truncatedText;
          this.textContent = ' Read more';
        }
      }
    });
    bodyWrapper.append(toggleLink);
  }

  // const capitalizedTitle = post.title.charAt(0).toUpperCase() + post.title.slice(1);
  const card = MyUI.Card({
    id: `post-${post.id}`,
    meta: `#${post.id}`,
    title: post.title,
    children: [bodyWrapper]
  });

  col.append(card);
  return col;
}

function setupInfiniteScroll() {
  const sentinel = document.querySelector('#scroll-sentinel');
  if (!sentinel) return;

  const observerOptions = {
    root: null,
    rootMargin: `${SCROLL_THRESHOLD}px`,
    threshold: 0.1
  };

  globalObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        void loadMorePosts();
      }
    });
  }, observerOptions);

  globalObserver.observe(sentinel);
}

function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;

  const sliced = text.slice(0, maxLength);
  const lastSpaceIndex = sliced.lastIndexOf(' ');

  if (lastSpaceIndex === -1) return sliced + '...';

  return sliced.slice(0, lastSpaceIndex) + '...';
}

async function fetchJSON(url, options ={}, errMsg='') {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`HTTP error: ${response.status} (${errMsg})`);
  return response.json();
}
