

const Repo = require('./repo');
const bcrypt = require('bcryptjs')
var mysql = require('mysql');
const ApiResponse = require('./apiResponse').ApiResponse

var login = (pool) => (req, res) => {
    res.send(ApiResponse(true, null))
}

var createAccount = (pool) => async (req, res) => {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(req.body.password, salt)

    if (!req.body.household) {
        console.log("WARNING: Someone tried to create a user without specifying a household");
        res.send(ApiResponse(false, false));
        return;
    }
    if (!req.body.username) {
        console.log("WARNING: Someone tried to create a user without specifying a username");
        res.send(ApiResponse(false, false));
        return;
    }

    try {
        var users = await pool.query("SELECT * FROM users WHERE username = ?", [req.body.username]);
        if (users.length > 0) {
            console.log("WARNING: Someone tried to create a duplicate username");
            res.send(ApiResponse(false, false));
            return;
        }
        var households = await pool.query("SELECT * FROM households WHERE `name` = ?", [req.body.household]);
        var householdId;

        if (Repo.QueryHadResults(households)) {
            householdId = households[0].id;
        } else {
            await pool.query("INSERT INTO households (`name`) VALUES (?)", [req.body.household]);
            householdId = (await pool.query("SELECT * FROM households WHERE `name` = ?", [req.body.household]))[0].id;
        }
        var recipe1 = await Repo.getRecipeById(pool, 641)
        var recipe2 = await Repo.getRecipeById(pool, 681)

        recipe1.householdId = householdId;
        console.log(recipe1.materials[0]);
        recipe1.materials = recipe1.materials.map((mat) => {
            delete mat.id;
            return mat;
        })
        recipe2.householdId = householdId;
        recipe2.materials = recipe2.materials.map((mat) => {
            delete mat.id;
            return mat;
        })

        console.log(recipe1.materials[0]);
        pool.getConnection(async (err, con) => {
            if (err) {
                console.log(err)
            }
            await Repo.createRecipe(recipe1, pool, con)
        })
        pool.getConnection(async (err, con) => {
            if (err) {
                console.log(err)
            }
            await Repo.createRecipe(recipe2, pool, con)
        });

        await pool.query("INSERT INTO users (`username`, `password`, `householdId`) VALUES ( ?, ?, ?)", [req.body.username, hash, householdId]);
        res.send(ApiResponse(false, true));

    }
    catch (err) {
        console.log(err);
        res.send(ApiResponse(false, null));
    }
}

var logout = (pool) => (req, res, next) => {
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