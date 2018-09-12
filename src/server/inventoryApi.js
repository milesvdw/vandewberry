// tslint:disable:no-console
var mysql = require('mysql');
const ApiResponse = require('./apiResponse').ApiResponse
const Repo = require('./repo');

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
            return await Repo.updateIngredient(req.user, req.body);
        }
        catch (err) {
            res.send(ApiResponse(true, false));
            return;
        }
    } else {
        // create a brand-new ingredient
        try {
            return await Repo.insertIngredient(req.user, req.body)
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