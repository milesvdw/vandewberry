// tslint:disable:no-console
var mysql = require('mysql');
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
    if (req.body.name === "") {
        console.log("ERROR: damn users making empty ingredients");
        return res.json(ApiResponse(true, false));
    }
    if (req.body.id > 0) {
        try {
            var existingIngredient = await pool.query("SELECT ingredients.*, ingredientgroups.name as name FROM ingredients \
            INNER JOIN ingredientgroups \
            ON ingredients.id = ? AND ingredients.ingredientGroupId = ingredientgroups.id", [req.body.id]);
            if (existingIngredient.length === 0) {
                console.log("ERROR: tried to update a non-existent ingredient");
                return;
            }
            if (existingIngredient[0].householdId !== req.user.householdId) {
                console.log("ERROR: tried to update another user's ingredient");
                return;
            }

            if (existingIngredient[0].name.trim() !== req.body.name.trim()) {
                // decouple this from the old ingredient group and potentially create a new ingredient group for it
                let existingGroups = await pool.query("SELECT * FROM ingredientgroups WHERE `name` = ?", [req.body.name.trim()]);
                if (existingGroups.length > 0) {
                    // hook the material up to the existing ingredientgroup
                    await pool.query("INSERT INTO ingredientgroups (`name`) VALUES (?)", [req.body.name.trim()]); // TODO consider optimizing this to use one connection
                    let insertedIngredientGroupId = (await pool.query("SELECT * from ingredientgroups WHERE `name` = ? LIMIT 1", [req.body.name.trim()]))[0].id;
                    // just update the ingredient's fields
                    await pool.query("UPDATE ingredients SET \
                        ingredientGroupId = ?, \
                        category = ?, \
                        statusID = ?, \
                        expires = ?, \
                        shelf_life = ? \
                        WHERE id = ?",
                        [insertedIngredientGroupId, req.body.category, req.body.statusID, req.body.expires ? 1 : 0, req.body.shelf_life, req.body.id]);
                    res.json(ApiResponse(true, req.body.id));
                    return;
                } else {
                    await pool.query("INSERT INTO ingredientgroups (`name`) VALUES (?)", [req.body.name.trim()]);
                    let insertedIngredientGroupId = (await pool.query("SELECT * from ingredientgroups WHERE `name` = ? LIMIT 1", [req.body.name.trim()]))[0].id;
                    await pool.query("UPDATE ingredients SET \
                        ingredientGroupId = ?, \
                        category = ?, \
                        statusID = ?, \
                        expires = ?, \
                        shelf_life = ? \
                        WHERE id = ?",
                        [insertedIngredientGroupId, req.body.category, req.body.statusID, req.body.expires ? 1 : 0, req.body.shelf_life, req.body.id]);
                    res.json(ApiResponse(true, req.body.id));
                    return;
                }
            } else {
                // just update the ingredient's fields
                await pool.query("UPDATE ingredients SET \
                    category = ?, \
                    statusID = ?, \
                    expires = ?, \
                    shelf_life = ? \
                    WHERE id = ?",
                    [req.body.category, req.body.statusID, req.body.expires ? 1 : 0, req.body.shelf_life, req.body.id]);
                res.json(ApiResponse(true, req.body.id));
                return;
            }
        }
        catch (err) {
            res.send(ApiResponse(true, []));
            return;
        }
    } else {
        // create a brand-new ingredient
        try {
            let existingGroups = await pool.query("SELECT * FROM ingredientgroups WHERE `name` = ?", [req.body.name]);
            if (existingGroups.length > 0) {
                // hook the material up to the existing ingredientgroup
                await pool.query("INSERT INTO ingredientgroups (`name`) VALUES (?)", [req.body.name]); // TODO consider optimizing this to use one connection
                let insertedIngredientGroupId = (await pool.query("SELECT * from ingredientgroups WHERE `name` = ? LIMIT 1", [req.body.name.trim()]))[0].id;
                // just update the ingredient's fields
                pool.getConnection((err, con) => {
                    console.log(mysql.format("INSERT INTO ingredients (`ingredientGroupId`, `category`, `statusID`, `expires`, `shelf_life`, `householdId`) \
                    VALUES (?, ?, ?, ?, ?, ?) ",
                        [insertedIngredientGroupId, req.body.category, req.body.statusID, req.body.expires ? 1 : 0, req.body.shelf_life, req.user.householdId]));
                    con.query("INSERT INTO ingredients (`ingredientGroupId`, `category`, `statusID`, `expires`, `shelf_life`, `householdId`) \
                    VALUES (?, ?, ?, ?, ?, ?) ",
                        [insertedIngredientGroupId, req.body.category, req.body.statusID, req.body.expires ? 1 : 0, req.body.shelf_life, req.user.householdId], (err2, ignore) => {
                            con.query("SELECT LAST_INSERT_ID()", (err3, insertedIdRaw) => {
                                if (err3) {
                                    console.log("ERROR at selecting last insert id after inserting new ingredient");
                                    console.log(err3);
                                    con.release();
                                    res.json(ApiResponse(true, false));
                                    return;
                                }
                                con.release();
                                res.json(ApiResponse(true, req.body.id));
                            })
                        });
                });
            } else {
                await pool.query("INSERT INTO ingredientgroups (`name`) VALUES (?)", [req.body.name.trim()]);
                let insertedIngredientGroupId = (await pool.query("SELECT * from ingredientgroups WHERE `name` = ? LIMIT 1", [req.body.name.trim()]))[0].id;
                pool.getConnection((err, con) => {
                    console.log(mysql.format("INSERT INTO ingredients (`ingredientGroupId`, `category`, `statusID`, `expires`, `shelf_life`, `householdId`) \
                    VALUES (?, ?, ?, ?, ?, ?) ",
                    [insertedIngredientGroupId, req.body.category, req.body.statusID, req.body.expires ? 1 : 0, req.body.shelf_life, req.user.householdId]))
                    con.query("INSERT INTO ingredients (`ingredientGroupId`, `category`, `statusID`, `expires`, `shelf_life`, `householdId`) \
                        VALUES (?, ?, ?, ?, ?, ?) ",
                        [insertedIngredientGroupId, req.body.category, req.body.statusID, req.body.expires ? 1 : 0, req.body.shelf_life, req.user.householdId], (err2, ignore) => {
                            con.query("SELECT LAST_INSERT_ID()", (err3, insertedIdRaw) => {
                                if (err3) {
                                    console.log("ERROR at selecting last insert id after inserting new ingredient");
                                    console.log(err3);
                                    con.release();
                                    res.json(ApiResponse(true, false));
                                    return;
                                }
                                con.release();
                                res.json(ApiResponse(true, req.body.id));
                            })
                        });
                });
            }
        }
        catch (err) {
            res.send(ApiResponse(true, false));
        }
    }
}

var get = (pool) => async (req, res) => {
    try {
        var ingredients = await pool.query("SELECT ingredients.id as id, ingredientgroups.name as name, category, statusID, expires, shelf_life from ingredients \
        INNER JOIN ingredientgroups ON ingredients.ingredientGroupId = ingredientgroups.id AND householdId = ?", [req.user.householdId]);
        console.log(ingredients[0]);
        res.send(ApiResponse(true, ingredients));
    }
    catch (err) {
        res.send(ApiResponse(true, []));
    }
}

module.exports.delete = deleteItem;
module.exports.post = post;
module.exports.get = get;