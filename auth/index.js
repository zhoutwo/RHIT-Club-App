const RFTVerifierConstructor = require('rosefire-node');

let RFTVerifier;

/**
 * Verifies whether the given token 
 */
function getIdentity(token) {
  return new Promise((resolve, reject) => {
    RFTVerifier.verify(token, (err, authData) => {
      if (err) {
        return reject(err);
      }
      let userData = {
        rose_username: authData.username,
        email: authData.email || `${authData.username}@rose-hulman.edu`,
        name: authData.name
      };
      return resolve(userData);
    })
  })
}

const toExport = {
  getIdentity: getIdentity
};
/**
 * Initialize this module with the secret to connect to the database. Possibly obtained via environment variable
 */
module.exports = function(secret) {
  if (!RFTVerifier) {
    if (!secret) {
      throw new Error('You must specify a secret!');
    }
    RFTVerifier = new RFTVerifierConstructor(secret);
  }
  return toExport;
}
