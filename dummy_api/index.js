const express = require('express');
const app = express();
const port = 3000;

const general = require('./general.json');
const random = require('./random.json');
const code = require('./code.json');

// Simulate asynchronous operation
function asyncOperation(index, channel = 'general') {
  return new Promise(resolve => {
    setTimeout(() => {
      const channelData = {
        general: general,
        random: random,
        code: code,
      };
      
      if (channelData[channel]) {
        let response = channelData[channel][index % channelData[channel].length];
        resolve(response);
      } else {
        resolve(null);
      }
    }, 1000);
  });
}

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/data', async (req, res) => {
  let index = req.query.index || 0;
  let channel = req.query.channel || 'general';
  console.log('index:', index, 'channel:', channel);
  const response = await asyncOperation(index, channel);
  res.send(response);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
