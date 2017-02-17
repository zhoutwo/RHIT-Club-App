const port = process.env.port || 3000;
const RFSecret = process.env.RFSecret || (() => {console.error("No RoseFire secret provided"); return process.exit(1)})();

const spdy = require('spdy');
const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const auth = require('./auth')(RFSecret);
const apiRouter = require('./api').router;

const fileRouter = require('./file').router;

const app = express();

const options = {
  key: fs.readFileSync(path.join(__dirname, '/cert/server.key')),
  cert:  fs.readFileSync(path.join(__dirname, '/cert/server.crt'))
};

app.use(cookieParser());
app.use((req, res, next) => {
  if (!req.cookies.token && req.headers.cookie) {
    if (!req.cookies) {
      req.cookies = {};
    }
    if (req.headers.cookie.indexOf("token=") == 0) {
      req.cookies["token"] = req.headers.cookie.substring(6);
    }
  }
  next();
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/file/", fileRouter);

app.use('/api/', apiRouter);

app.get('/', (req, res) => {
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
