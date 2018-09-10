
const ApiResponse = require('./apiResponse').ApiResponse

var deleteItem = (pool) => async (req, res) => {
    try {
        var ingredients = await pool.query("DELETE FROM ingredients WHERE id = ?", [req.body.id]);
        res.send(ApiResponse(true, null));
    }
    catch (err) {
        res.send(ApiResponse(true, null));
    }
}

var post = (pool) => async (req, res) => {
    var connection;
    if (req.body.id > 0) {
        try {
            connection = pool.getConnection((err2, con) => {
                con.query(
                    "UPDATE ingredients SET \
                    `name` = '?', \
                    category = '?', \
                    statusID = ?, \
                    expires = '?', \
                    shelf_life = '?', \
                    householdId = ? \
                    WHERE id = ?",
                    [req.body.name, req.body.category, req.body.statusId, req.body.expires, req.body.shelf_life, req.body.householdId, req.body.id],
                    (err3, ingredient) => {
                        res.json(ApiResponse(true, req.body.id));
                    });
            });
        }
        catch (err) {
            res.send(ApiResponse(true, []));
        }
    } else {
        try {
            connection = pool.getConnection((err2, con) => {
                con.query(
                    "INSERT INTO ingredients (`name`, category, statusID, expires, shelf_life, householdId) VALUES ( '?', '?', ?, '?', '?', ?)",
                    [req.body.name, req.body.category, req.body.statusId, req.body.expires, req.body.shelf_life, req.body.householdId, req.body.id],
                     (err3, ingredient) => {
                        con.query("SELECT LAST_INSERT_ID()", (err4, insertResults) => {
                            res.json(ApiResponse(true, insertResults[0]['LAST_INSERT_ID()']));
                        });
                    });
            });
        }
        catch (err) {
            res.send(ApiResponse(true, []));
        }
    }
}

var get = (pool) => async (req, res) => {
    try {
        var ingredients = await pool.query("SELECT ingredients.id as id, name, category, statusID, expires, shelf_life from ingredients WHERE householdId = ?", [req.user.householdId]);
        res.send(ApiResponse(true, ingredients));
    }
    catch (err) {
        res.send(ApiResponse(true, []));
    }
}

module.exports.delete = deleteItem;
module.exports.post = post;
module.exports.get = get;