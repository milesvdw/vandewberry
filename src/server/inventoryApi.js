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

async function getExistingIngredientById(id) {
    await pool.query("SELECT ingredients.*, ingredientgroups.name as name FROM ingredients \
            INNER JOIN ingredientgroups \
            ON ingredients.id = ? AND ingredients.ingredientGroupId = ingredientgroups.id", [id]);
}

async function updateIngredientValues(category, statusID, expires, shelf_life, id, ingredientGroupId) {
    if (ingredientGroupid) {

        await pool.query("UPDATE ingredients SET \
                        ingredientGroupId = ?, \
                        category = ?, \
                        statusID = ?, \
                        expires = ?, \
                        shelf_life = ? \
                        WHERE id = ?",
            [ingredientGroupId, category, statusID, expires, shelf_life, id]);
    }
    else {

    }
}

async function getIngredientGroupbyName(name) {
    let existingGroups = await pool.query("SELECT * FROM ingredientgroups WHERE `name` = ? LIMIT 1", [name]);
    return existingGroups;
}

async function updateIngredient(user, ingredient) {
    var existingIngredient = await getExistingIngredientByid(ingredient.id)
    if (existingIngredient.length === 0) {
        console.log("ERROR: tried to update a non-existent ingredient");
        return;
    }
    if (existingIngredient[0].householdId !== user.householdId) {
        console.log("ERROR: tried to update another user's ingredient");
        return;
    }

    var ingredientGroupId;
    if (existingIngredient[0].name.trim() !== ingredient.name.trim()) {
        // decouple this from the old ingredient group and potentially create a new ingredient group for it
        let existingGroups = await getIngredientGroupbyName(ingredient.name.trim());

        if (existingGroups.length > 0) {
            ingredientGroupId = existingGroups[0].id;
        } else {
            await pool.query("INSERT INTO ingredientgroups (`name`) VALUES (?)", [ingredient.name.trim()]);
            ingredientGroupId = (await getIngredientGroupbyName(ingredient.name.trim()))[0].id;
        }

        await updateIngredientValues(ingredient.category, ingredient.statusID, ingredient.expires ? 1 : 0, ingredient.shelf_life, ingredient.id, insertedIngredientGroupId);
    } else {
        // just update the ingredient's fields
        await updateIngredientValues(ingredient.category, ingredient.statusID, ingredient.expires ? 1 : 0, ingredient.shelf_life, ingredient.id)

    }
    res.json(ApiResponse(true, ingredient.id));
}

async function insertIngredientValues(ingredientGroupId, category, statusID, expires, shelf_life, householdId) {
    pool.getConnection((err, con) => {
        con.query("INSERT INTO ingredients (`ingredientGroupId`, `category`, `statusID`, `expires`, `shelf_life`, `householdId`) \
            VALUES (?, ?, ?, ?, ?, ?) ",
            [ingredientGroupId, category, statusID, expires, shelf_life, householdId], (err2, ignore) => {
                con.query("SELECT LAST_INSERT_ID()", (err3, insertedIdRaw) => {
                    if (err3) {
                        console.log("ERROR at selecting last insert id after inserting new ingredient");
                        console.log(err3);
                        con.release();
                        res.json(ApiResponse(true, false));
                        return;
                    }
                    con.release();
                    res.json(ApiResponse(true, ingredient.id));
                })
            });
    });
}

async function insertIngredient(user, ingredient) {
    var ingredientGroupId;

    let existingGroups = await getIngredientGroupbyName(ingredient.name.trim());
    if (existingGroups.length > 0) {
        ingredientGroupId = existingGroups[0].id;
    } else {
        await pool.query("INSERT INTO ingredientgroups (`name`) VALUES (?)", [ingredient.name.trim()]);
        ingredientGroupId = (await getIngredientGroupbyName(ingredient.name.trim()))[0].id;
    }
    return await insertIngredientValues(ingredientGroupId, ingredient.category, ingredient.statusID, ingredient.expires ? 1 : 0, ingredient.shelf_life, user.householdId);
}

var post = (pool) => async (req, res) => {
    if (req.body.name === "") {
        console.log("ERROR: damn users making empty ingredients");
        return res.json(ApiResponse(true, false));
    }
    if (req.body.id > 0) {
        try {
            return await updateIngredient(req.user, req.body);
        }
        catch (err) {
            res.send(ApiResponse(true, false));
            return;
        }
    } else {
        // create a brand-new ingredient
        try {
            return await insertIngredient(req.user, req.body)
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
        res.send(ApiResponse(true, ingredients));
    }
    catch (err) {
        res.send(ApiResponse(true, []));
    }
}

module.exports.delete = deleteItem;
module.exports.post = post;
module.exports.get = get;