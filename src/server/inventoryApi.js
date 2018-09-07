
const ApiResponse = require('./apiResponse').ApiResponse

var deleteItem = (db) => (req, res) => {
    db.collection('inventory').remove({ "_id": ObjectId(req.body._id) });
    res.json(ApiResponse(true, null));
}

var post = (pool) => async (req, res) => {
    var connection;
    if (req.body.id > 0) {
        try {
            connection = pool.getConnection((err2, con) => {
                con.query(
                    "UPDATE ingredients SET `name` = '" + req.body.name + "', " +
                    "category = '" + req.body.category + "', " +
                    "statusID = " + req.body.statusID + ", " +
                    "expires = '" + req.body.expires + "', " +
                    "shelf_life = '" + req.body.shelf_life + "', " +
                    "householdId = " + req.user.householdId + " WHERE id = " + req.body.id, (err3, ingredient) => {
                        console.log(err3);
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
                    "INSERT INTO ingredients (`name`, category, statusID, expires, shelf_life, householdId) VALUES ( '" +
                    req.body.name + "', '" +
                    req.body.category + "', " +
                    req.body.statusID + ", '" +
                    req.body.expires + "', '" +
                    req.body.shelf_life + "', " +
                    req.user.householdId + ")", (err3, ingredient) => {
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
        var ingredients = await pool.query("SELECT ingredients.id as id, name, category, statusID, expires, shelf_life from ingredients WHERE householdId = " + req.user.householdId);
        res.send(ApiResponse(true, ingredients));
    }
    catch (err) {
        res.send(ApiResponse(true, []));
    }
}

module.exports.delete = deleteItem;
module.exports.post = post;
module.exports.get = get;