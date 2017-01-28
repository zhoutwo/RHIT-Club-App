
function dummyVerify() {
  return true;
}
usernameToToken = {};
tokenToUsername = {};
usernameToTimeout = {};

function login(username, password) {
  if (dummyVerify(username, password)) {
    let token = generateToken();
    usernameToToken[username] = token;
    tokenToUsername[token] = username;
    usernameToTimeout[username] = setTimeout(() -> {
      logout(username);
    });
    return token;
  }
  return false;
}

function logout(username, token) {
  if (!username) {
    username = tokenToUsername[token];
  } else {
    token = usernameToToken[username];
  }
  delete usernameToToken[username];
  delete tokenToUsername[token];
  clearTimeout(usernameToTimeout[username]);
  delete usernameToTimeout[username];
}

function verifyToken(username, token) {
  if (usernameToToken[username] == token && username == tokenToUsername[token]) {
    return true;
  }
  return false;
}

function generateToken() {
  let token = Math.round(Math.random() * 1000000) + "";
  return token;
}

module.exports = {
  login: login,
  logout: logout,
  verifyToken: verifyToken,
  generateToken: generateToken
}
