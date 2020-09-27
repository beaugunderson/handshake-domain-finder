const { createHashHistory } = require('history');
const emojiRegex = require('emoji-regex');
const queryString = require('query-string');
const XRegExp = require('xregexp');

const emojiExpression = `(${emojiRegex().source})`;

XRegExp.addToken(/\\m/, () => emojiExpression, {
  scope: 'default',
});

const MAX_RESULTS = 35;

const history = createHashHistory();

const domains = require('./domains.json').map((domain) => {
  domain[1] = BigInt(domain[1]);
  return domain;
});

const $search = document.getElementById('domain-regex');
const $maxCost = document.getElementById('max-cost');
const $minCost = document.getElementById('min-cost');

const $results = document.getElementById('results');

function domainHtml(domain) {
  const [name, price, english, unicode] = domain;

  if (unicode) {
    return `<div><a href="https://www.namebase.io/domains/${name}"><strong>${price}</strong></a> ${name} <span class="arrow">→</span> ${unicode}</div>`;
  }

  return `<div><a href="https://www.namebase.io/domains/${name}"><strong>${price}</strong></a> <span class="${
    english ? 'english' : ''
  }">${name}</span></div>`;
}

function parseLocation() {
  const { maxCost, minCost, search } = queryString.parse(
    history.location.search
  );

  let parsedMaxCost;
  let parsedMinCost;
  let parsedSearch;

  try {
    parsedMaxCost = BigInt(maxCost || '');
    $maxCost.className = '';
  } catch (e) {
    $maxCost.className = 'error';
  }

  try {
    parsedMinCost = BigInt(minCost || '');
    $minCost.className = '';
  } catch (e) {
    $minCost.className = 'error';
  }

  try {
    parsedSearch = XRegExp(search, 'i');
    $search.className = '';
  } catch (e) {
    console.error(e);
    $search.className = 'error';
  }

  return {
    search: parsedSearch,
    minCost: parsedMinCost,
    maxCost: parsedMaxCost,
  };
}

function updateInputs() {
  const { search, minCost, maxCost } = queryString.parse(
    history.location.search
  );

  $search.value = search || '';
  $minCost.value = minCost || '';
  $maxCost.value = maxCost || '';
}

function searchInner(showAll) {
  $results.innerHTML = 'loading...';

  const { search, minCost, maxCost } = parseLocation();

  const filtered = domains.filter(
    (domain) =>
      (search === undefined ||
        search.test(domain[0]) ||
        (domain[3] && search.test(domain[3]))) &&
      (!maxCost || domain[1] <= maxCost) &&
      (!minCost || domain[1] >= minCost)
  );

  $results.innerHTML = filtered
    .slice(0, showAll === true ? filtered.length : MAX_RESULTS)
    .map(domainHtml)
    .join('\n');

  const extra = filtered.length - MAX_RESULTS;

  if (showAll !== true && extra > 0) {
    $results.innerHTML += `<div id="show-additional"><a href="#" id="show-all">show ${extra} additional</a></div>`;

    const $showAll = document.getElementById('show-all');

    $showAll.onclick = (e) => {
      e.preventDefault();
      window.search(true);
    };
  }
}

// eslint-disable-next-line no-multi-assign
const search = (window.search = (showAll) =>
  setTimeout(() => searchInner(showAll), 0));

function updateHash() {
  history.push({
    pathname: '/',
    search: `?${queryString.stringify(
      {
        search: $search.value,
        minCost: $minCost.value,
        maxCost: $maxCost.value,
      },
      { encode: true }
    )}`,
  });
}

$search.oninput = updateHash;
$maxCost.onkeyup = updateHash;
$minCost.onkeyup = updateHash;

history.listen(() => {
  updateInputs();
  search();
});

updateInputs();
search();
