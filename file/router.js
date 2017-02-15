const express = require('express');
const router = express.Router();
const backend = require('../backend');
const file = require('./index.js');

router.get('/:fileId', (req, res) => {
  backend.getFilePathById(fileId).then((filePath) => {
    return file.getFile(filePath).then((file) => {
      res.status(200).pipe(file);
    });
  }).catch((err) => {
    res.status(403).send('Failed to retrieve the file');
  });
});

router.post('/:fileId', (req, res) => {
  backend.getFilePathById(fileId).then((filePath) => {
    return file.postFile(filePath, req).then((message) => {
      res.status(200).send(message);
    });
  }).catch((err) => {
    res.status(403).send('Failed to retrieve the file');
  });
});

router.delete('/:fileId', (req, res) => {
  backend.getFilePathById(fileId).then((filePath) => {
    return file.deleteFile(filePath).then((message) => {
      res.status(200).send(message);
    });
  }).catch((err) => {
    res.status(403).send('Failed to retrieve the file');
  });
});

router.all('*', (req, res) => {
  res.status(404).send('Unknown route');
});

module.exports = router;
