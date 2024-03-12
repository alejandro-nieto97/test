const express = require('express');
const app = express();
const port = 3000;

const data = require('./data.json');

// Simulate asynchronous operation
function asyncOperation(index) {
  return new Promise(resolve => {
    setTimeout(() => {
      let response = data[index % data.length];
      resolve(response);
    }, 1000);
  });
}

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/data', async (req, res) => {
  let index = req.query.index || 0;
  console.log('index:', index);
  const response = await asyncOperation(index);
  res.send(response);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
