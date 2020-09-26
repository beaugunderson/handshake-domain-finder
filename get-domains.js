#!/usr/bin/env node

'use strict';

const HNS_DIVISOR = 1000000n;

const bent = require('bent');
const fs = require('fs');

const getJSON = bent('json');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function page(offset) {
  return getJSON(`https://www.namebase.io/api/domains/marketplace/${offset}?sortKey=date&sortDirection=desc`);
}

async function main() {
  let offset = 0;

  let response;
  let domains = [];

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

  let records = [];

  for (const domain of domains) {
    records.push([
      domain.name,
      (BigInt(domain.amount) / HNS_DIVISOR).toString()
    ])
  }

  fs.writeFileSync('./domains.json', JSON.stringify(records), 'utf-8');
}

main();
