'use strict';

const domains = require('./domains.json').map(domain => {
  domain[1] = BigInt(domain[1]);
  return domain;
});

function compare(a, b) {
  if (a[0] < b[0]) {
    return -1;
  }

  if (a[0] > b[0]) {
    return 1;
  }

  return 0;
}

domains.sort(compare);

const $search = document.getElementById('domain-regex');
const $maxCost = document.getElementById('max-cost');
const $minCost = document.getElementById('min-cost');

const $results = document.getElementById('results');

const MAX_RESULTS = 35;

const search = window.search = function search(showAll) {
  setTimeout(() => searchInner(showAll), 0);
};

$search.onkeyup = search;
$maxCost.onkeyup = search;
$minCost.onkeyup = search;

function searchInner(showAll) {
  let maxCost;
  let minCost;

  let re;

  try {
    maxCost = BigInt($maxCost.value);
    $maxCost.className = '';
  } catch (e) {
    $maxCost.className = 'error';
  }

  try {
    minCost = BigInt($minCost.value);
    $minCost.className = '';
  } catch (e) {
    $minCost.className = 'error';
  }

  try {
    re = new RegExp($search.value, 'i');
    $search.className = '';
  } catch (e) {
    $search.className = 'error';
    return;
  }

  $results.innerHTML = 'loading...';

  const filtered = domains.filter(
    domain =>
      re.test(domain[0]) &&
        (!maxCost || domain[1] <= maxCost) &&
        (!minCost || domain[1] >= minCost));

  $results.innerHTML = filtered
    .slice(0, showAll === true ? filtered.length : MAX_RESULTS)
    .map(domain => `<div><a href="https://www.namebase.io/domains/${domain[0]}"><strong>${domain[1]}</strong></a> ${domain[0]}</div>`)
    .join('\n');

  const extra = filtered.length - MAX_RESULTS;

  if (showAll !== true && extra > 0) {
    $results.innerHTML += `<div id="show-additional"><a href="#" onclick="javascript:window.search(true);">show ${extra} additional</a></div>`;
  }
}

search();
