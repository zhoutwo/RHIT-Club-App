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
        username: authData.username,
        email: authData.email || `${authData.username}@rose-hulman.edu`,
        name: authData.name
      };
      return resolve(userData);
    })
  })
}

/**
 * Initialize this module with the secret to connect to the database. Possibly obtained via environment variable
 */
module.exports = function(secret) {
  if (RFTVerifier) {
    throw new Error('RoseFire Token Verifier already initialized')
  } else {
    RFTVerifier = new RFTVerifierConstructor(secret);
  }
  return {
    getIdentity: getIdentity
  };
}
