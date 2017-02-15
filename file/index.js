const fs = require("fs");
const path = require("path");
const base = path.join(__dirname, './allFiles/');
const router = require('./router.js');

/*
Generates a path given a file_id
*/
function generatePath(file_id) {
  return path.join(base, file_id);
}

/*
Uploads a file locally given the file and the filePath
*/
function postFile(filePath, file) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, file, function(error) {
      if (error) {
        return reject(error);
      }
      return resolve("Successful Write to " + path);
    });
  });
};

/*
Returns the file desired given the filePath
*/
function getFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, function(error, data) {
      if (error) {
        return reject(error);
      }
      return resolve(data);
    });
  });
}

/*
Deletes the file stored locally given a filePath
*/
function deleteFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, function(err) {
      if (err) {
        return reject(err);
      }
      return resolve("File deleted successfully");
    });
  });
}

module.exports = {
  generatePath: generatePath,
  postFile: postFile,
  getFile: getFile,
  deleteFile: deleteFile,
  router: router
};
