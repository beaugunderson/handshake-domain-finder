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
  return [
    domain[0],
    BigInt(domain[1]),
    domain[2],
    new Date(domain[3]),
    domain[4],
  ];
});

const $search = document.getElementById('domain-regex');
const $maxCost = document.getElementById('max-cost');
const $minCost = document.getElementById('min-cost');
const $minDate = document.getElementById('min-date');
const $englishOnly = document.getElementById('english-only');
const $sort = document.getElementById('sort');

const $results = document.getElementById('results');

function domainHtml(domain) {
  const [name, price, english, isoDate, unicode] = domain;

  const date = `<span class="date">${isoDate.getFullYear()}-${
    isoDate.getMonth() + 1
  }-${isoDate.getDate()}</span>`;

  if (unicode) {
    return `<div>${date} <a href="https://www.namebase.io/domains/${name}" target="_blank" rel="noopener"><strong>${price}</strong></a> ${name} <span class="arrow">→</span> ${unicode}</div>`;
  }

  return `<div>${date} <a href="https://www.namebase.io/domains/${name}" target="_blank" rel="noopener"><strong>${price}</strong></a> <span class="${
    english ? 'english' : ''
  }">${name}</span></div>`;
}

function sortByName(a, b) {
  if (a[0] < b[0]) {
    return -1;
  }

  if (a[0] > b[0]) {
    return 1;
  }

  return 0;
}

function sortByNameLength(a, b) {
  if (a[0].length < b[0].length) {
    return -1;
  }

  if (a[0].length > b[0].length) {
    return 1;
  }

  return sortByName(a, b);
}

function sortByPrice(a, b) {
  if (a[1] < b[1]) {
    return -1;
  }

  if (a[1] > b[1]) {
    return 1;
  }

  return sortByName(a, b);
}

const sortFunctions = {
  name: sortByName,
  price: sortByPrice,
  length: sortByNameLength,
};

function parseLocation() {
  const {
    search,
    maxCost,
    minCost,
    minDate,
    englishOnly,
    sort,
  } = queryString.parse(history.location.search);

  let parsedSearch;
  let parsedMaxCost;
  let parsedMinCost;
  let parsedMinDate;

  try {
    parsedSearch = XRegExp(search, 'i');
    $search.className = '';
  } catch (e) {
    console.error(e);
    $search.className = 'error';
  }

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
    parsedMinDate = new Date(minDate);
    $minDate.className = '';
  } catch (e) {
    minDate.className = 'error';
  }

  const parsedEnglishOnly = englishOnly === 'true';

  let sortFunction = sortFunctions.name;

  if (sort) {
    sortFunction = sortFunctions[sort];
  }

  return {
    search: parsedSearch,
    minCost: parsedMinCost,
    maxCost: parsedMaxCost,
    minDate: parsedMinDate,
    englishOnly: parsedEnglishOnly,
    sort: sortFunction,
  };
}

function updateInputs() {
  const {
    search,
    minCost,
    maxCost,
    minDate,
    englishOnly,
    sort,
  } = queryString.parse(history.location.search);

  let sortIndex = 0;

  for (let i = 0; i < $sort.options.length; i++) {
    if ($sort.options[i].value === sort) {
      sortIndex = i;
    }
  }

  $search.value = search || '';
  $minCost.value = minCost || '';
  $maxCost.value = maxCost || '';
  $minDate.value = minDate || '';
  $englishOnly.checked = englishOnly === 'true';
  $sort.selectedIndex = sortIndex;
}

function searchInner(showAll) {
  $results.innerHTML = 'loading...';

  const {
    search,
    minCost,
    maxCost,
    minDate,
    englishOnly,
    sort,
  } = parseLocation();

  const filtered = domains.filter(
    (domain) =>
      (search === undefined ||
        search.test(domain[0]) ||
        (domain[4] && search.test(domain[4]))) &&
      (!maxCost || domain[1] <= maxCost) &&
      (!minCost || domain[1] >= minCost) &&
      (!minDate || Number.isNaN(minDate.valueOf()) || domain[3] >= minDate) &&
      (!englishOnly || domain[2])
  );

  filtered.sort(sort);

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
        minDate: $minDate.value,
        englishOnly: $englishOnly.checked ? 'true' : 'false',
        sort: $sort.options[$sort.selectedIndex].value,
      },
      { encode: true }
    )}`,
  });
}

$search.oninput = updateHash;
$maxCost.oninput = updateHash;
$minCost.oninput = updateHash;
$minDate.oninput = updateHash;
$englishOnly.oninput = updateHash;
$sort.onchange = updateHash;

history.listen(() => {
  updateInputs();
  search();
});

updateInputs();
search();
