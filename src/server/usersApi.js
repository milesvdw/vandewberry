

const ApiResponse = require('./apiResponse').ApiResponse

var login = (db) => (req, res) => {
    res.send(ApiResponse(true, null))
}

var createAccount = (pool) => (req, res) => {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(req.body.password, salt)

    try {
        var users = await pool.query("SELECT FROM users WHERE user = ?", [req.body.username]);
        // db.collection('users').find({ user: req.body.username }).toArray((geterr, items) => {
        if (users.length > 0) {
            res.send(ApiResponse(false, false));
            return;
        }
        await pool.query("INSERT INTO users ( ?, ?, ?)", [req.body.username, hash, req.body.household]);
        // db.collection('users').save({ user: req.body.username, passwordHash: hash, household: req.body.household });
        res.send(ApiResponse(false, true));
        // });
    }
    catch (err) {
        res.send(ApiResponse(true, null));
    }
}

var logout = (db) => (req, res, next) => {
    req.logout();
    req.session.destroy(function (logerr) {
        if (!logerr) {
            res.clearCookie('connect.sid').send();
        } else {
            res.send();
        }

    });
}

module.exports.login = login;
module.exports.logout = logout;
module.exports.createAccount = createAccount;