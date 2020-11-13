'use strict';

const {NodeClient} = require('hs-client');
const {ChainEntry, Network} = require('hsd');
const network = Network.get('main');

const clientOptions = {
  network: network.type,
  port: network.rpcPort,
  apiKey: 'cd920cd33f53162fe131147e4492a5523b97c07f52cad0404b802950bbd531a1'
};

const client = new NodeClient(clientOptions);

(async () => {
  // Connection and both channel subscriptions handled by opening client
  await client.open();

  // function block(b) {
  //   console.log('b', b);
  // }

  // function txs(t) {
  //   console.log('t', t);
  // }

  const entryByHeight = await client.call('get entry', 30000);
  console.log(ChainEntry.fromRaw(entryByHeight));

  // const result = await client.execute('getblockbyheight', [ 30000, 1, 1 ]);
  // console.log(JSON.stringify(result, null, 2));

  const result = await client.getBlock(30000);
  console.log(JSON.stringify(result, null, 2));

  // client.call('rescan', block, txs)
})();

// Listen for new blocks
client.bind('chain connect', (raw) => {
  console.log('Node -- Chain Connect Event:\n', ChainEntry.fromRaw(raw));
});
