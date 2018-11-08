// tslint:disable:no-console
/* tslint:disable:no-string-literal */
var mysql = require('mysql');
const ApiResponse = require('./apiResponse').ApiResponse
const Repo = require('./repo');
// const utils = require('../utils/utils')

var deleteRecipe = (pool) => async (req, res) => {
    var recipes = (await pool.query("SELECT * FROM recipes WHERE id = ?", [req.body.id]));
    if (!Repo.QueryHadResults(recipes)) {
        console.log("ERROR: Can't delete a recipe that doesn't exist");
        res.json(ApiResponse(true, false));
        return;
    }
    var recipe = recipes[0]
    var materials = await pool.query("SELECT materials.* FROM recipes INNER JOIN materials ON materials.recipeId = recipes.id \
    AND recipes.id = ?", [req.body.id]);

    if (recipe.householdId !== req.user.householdId) {
        await pool.query("DELETE FROM household_recipes WHERE recipeId = ? AND householdId = ?", [req.body.id, req.user.householdId])
        res.json(ApiResponse(true, true));
        return;
    } else {
        var materialIds = materials.map((mat) => mat.id)
        if (materialIds.length > 0) {

            await pool.query("DELETE FROM materials_ingredientgroups WHERE materialId IN (?)", [materialIds]);
            await pool.query("DELETE FROM materials WHERE `id` IN (?)", [materialIds]);
        }
        await pool.query("DELETE FROM household_recipes WHERE recipeId = ?", [recipe.id]);
        await pool.query("DELETE FROM recipes WHERE `id` = ?", [req.body.id]);
        res.json(ApiResponse(true, true))
        return;
    }
    res.json(ApiResponse(true, false)); // TODO: this line maybe shouldn't exist at all. How would you get here?
}

var post = (pool) => async (req, res) => {
    req.body.householdId = req.user.householdId
    if (!req.body.name || req.body.name.length < 1) {
        console.log("User tried to save a recipe with an empty name. Shame on them, their family, and their dog.");
        res.json(ApiResponse(true, false));
        return;
    }
    if (req.body.id > 0) {
        // do an update
        pool.getConnection((err, con) => {
            Repo.updateRecipe(req, pool, con, res);
        });
    }
    else {
        // do an insert
        pool.getConnection(async (err, con) => {
            await Repo.createRecipe(req.body, pool, con, res);
        });
    }
}

var share = (pool) => async (req, res) => {
    // TODO: update the post to this endpoint to only send a household and a recipeId, all else is wasted bandwidth
    var householdId = '';
    var householdResults = await pool.query("SELECT * FROM households WHERE name = ?", [req.body.shareTarget])

    if (householdResults.length === 0) {
        var userResults = await pool.query("SELECT * FROM users WHERE username = ?", [req.body.shareTarget])

        if(userResults.length === 0) {
            console.log("user tried to share recipe with non-existent household/user");
            res.json(ApiResponse(true, false));
        }
        householdId = userResults[0].householdId;
    }
    else {
        householdId = householdResults[0].id;
    }
    await pool.query("INSERT INTO household_recipes (`householdId`, `recipeId`) VALUES (?, ?)", [householdId, req.body.id])
    res.json(ApiResponse(true, true));
}

Array.prototype.unique = function () {
    return this.filter((value, index) => this.indexOf(value) === index);
}

var get = (pool) => async (req, res) => {
    try {
        var recipeIds = (await pool.query("SELECT * FROM (SELECT recipes.id as id from recipes where householdId = ?) as r \
         UNION (SELECT recipeId as id from household_recipes where householdId = ?)", [req.user.householdId, req.user.householdId])).map((rrow) => rrow.id);
        if (recipeIds.length === 0) {
            res.send(ApiResponse(true, []));
            return;
        }

        return res.send(ApiResponse(true, await Repo.getRecipesByIdList(recipeIds, pool)));
    }
    catch (err) {
        console.log(err);
        res.send(ApiResponse(true, []));
    }
}

module.exports.share = share;
module.exports.delete = deleteRecipe;
module.exports.post = post;
module.exports.get = get;