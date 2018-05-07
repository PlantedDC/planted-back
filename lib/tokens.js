const readBody = require('./readBody');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');


const signature = '1nm@_s5sur1_a11rl3r';

let findUserByEmail = (db, email) => {
    return db.query(`
        SELECT * FROM users WHERE
            email = '${email}';
    `)
}

let createToken = user =>
  jwt.sign(
    { userid: user.userid },
    signature,
    { expiresIn: '7d' }
  );

let postTokens = async (req, res, db) => {
  let body = await readBody(req);
  let creds = JSON.parse(body);
  let { password, email  } = creds;
  let user = await findUserByEmail(db, email);
  let isValid;
  console.log(user[0])
  if (user[0]){
    isValid = await bcrypt.compare(password, user[0].passw);
  }
  if (isValid) {
    let token = createToken(user[0]);
    res.end(token);
  } else {
    res.status(401).end('No token for you!');
  }
};


module.exports = {
    postTokens,
    signature,
    findUserByEmail,
    createToken
};