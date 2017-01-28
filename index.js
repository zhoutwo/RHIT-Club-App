const port = process.env.port || 3000;
const spdy = require('spdy');
const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');

const auth = require('auth');

const app = express();

const options = {
  key: fs.readFileSync(path.join(__dirname, '/cert/server.key')),
  cert:  fs.readFileSync(path.join(__dirname, '/cert/server.crt'))
};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('*', (req, res) => {
  res
    .status(200)
    .json({message: 'ok'})
});

spdy
  .createServer(options, app)
  .listen(port, (error) => {
    if (error) {
      console.error(error);
      return process.exit(1);
    } else {
      console.log(`Server running on port ${port}`);
    }
  });
