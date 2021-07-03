const readBody = require('./lib/readBody')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
let { postTokens, signature, createToken, findUserByEmail } = require('./lib/tokens');
const db = require('./db');
const Router = require('express').Router;
const router = new Router();
const { getResults } = require('./graphQL');

router.get('/', (req,res) => {
    res.send('hello')
})

router.post('/login', async (req, res) => {
    postTokens(req, res, db)
})

router.post('/register', async (req, res) => {
    let userInfo = await readBody(req).then(data => JSON.parse(data))
    let { avatar, username, email, password } = userInfo
    let hash = await bcrypt.hash(password, 10);
    avatar ?
        await db.query(`
                INSERT INTO users (
                    username, email, passw, avatar
                )
                VALUES (
                        '${username}',
                        '${email}',
                        '${hash}',
                        '${avatar}'
                );`)
            .catch(err => console.log(err)) :
        await db.query(`
                INSERT INTO users (
                    username, email, passw
                )
                VALUES (
                        '${username}',
                        '${email}',
                        '${hash}'
                );`)
            .catch(err => console.log(err))

    let user = await findUserByEmail(db, email);
    let token = createToken(user);
    res.end(token);
})

router.post('/graphql', async (req, res) => {
    let { authorization: token } = req.headers;
    try {
        let payload = jwt.verify(token, signature);
        let userid = payload.userid;
        let query = await readBody(req)
        let results = await getResults(query, userid);
        res.send(results)
    } catch (err) {
        console.log("POST GRAPHQL - ERROR ####", err)
        res.status(401).end('Unauthorized')
    }
})

module.exports = router;