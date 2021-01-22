var jwt = require("jsonwebtoken");

function generateToken(user) {
  if (!user) return null;

  var u = {
    userID: user.userID,
    name: user.name,
    username: user.username,
    isAdmin: user.isAdmin,
  };
  console.log(u)
  return jwt.sign(u, process.env.JWT_SECRET, { expiresIn: 60 * 60 * 24 });
}

function getUserDetails(user) {
  if (!user) return null;

  return {
    userID: user.userID,
    name: user.name,
    username: user.username,
    isAdmin: user.isAdmin
  };
}

module.exports = {
    generateToken,
    getUserDetails
}
