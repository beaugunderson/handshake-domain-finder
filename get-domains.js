#!/usr/bin/env node

/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
/* eslint-disable no-restricted-syntax */

const HNS_DIVISOR = 1000000n;

const bent = require('bent');
const fs = require('fs');
const punycode = require('punycode');
const words = require('an-array-of-english-words');

const getJSON = bent('json');

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function page(offset) {
  return getJSON(
    `https://www.namebase.io/api/domains/marketplace/${offset}?sortKey=date&sortDirection=desc`
  );
}

const RE_PUNYCODE = /xn--[a-z0-9]+/i;

function isPunycode(domain) {
  return RE_PUNYCODE.test(domain);
}

async function main() {
  let offset = 0;

  let response;
  const domains = [];

  // eslint-disable-next-line no-constant-condition
  while (true) {
    response = await page(offset);

    if (!response || !response.domains || !response.domains.length) {
      console.log('no domains received');
      break;
    }

    console.log(offset, response.domains.length);

    domains.push(...response.domains);

    if (offset && offset % 500 === 0) {
      console.log('delaying');
      await delay(500);
    }

    offset += 100;
  }

  const records = [];

  for (const domain of domains) {
    const record = [
      domain.name,
      (BigInt(domain.amount) / HNS_DIVISOR).toString(),
      words.includes(domain.name.toLowerCase()) ? 1 : 0,
    ];

    if (isPunycode(domain.name)) {
      record.push(punycode.toUnicode(domain.name));
    }

    records.push(record);
  }

  fs.writeFileSync('./domains.json', JSON.stringify(records), 'utf-8');
}

main();
