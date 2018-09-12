// tslint:disable:no-console
/* tslint:disable:no-string-literal */
var mysql = require('mysql');
const ApiResponse = require('./apiResponse').ApiResponse
const Repo = require('./repo');
// const utils = require('../utils/utils')

var deleteRecipe = (pool) => async (req, res) => {
    var recipes = (await pool.query("SELECT * FROM recipes WHERE id = ?", [req.body.id]));
    if (!QueryHadResults(recipes)) {
        console.log("ERROR: Can't delete a recipe that doesn't exist");
        res.json(ApiResponse(true, false));
        return;
    }
    var recipe = recipes[0]
    var materials = await pool.query("SELECT materials.* FROM recipes INNER JOIN materials ON materials.recipeId = recipes.id \
    AND recipes.id = ?", [req.body.id]);

    if (recipe.householdId !== req.user.householdId) {
        console.log("ERROR: attempted to delete a recipe that the user doesn't own");
        res.json(ApiResponse(true, false));
        return;
    } else {
        var materialIds = materials.map((mat) => mat.id)
        await pool.query("DELETE FROM materials_ingredientgroups WHERE materialId IN (?)", [materialIds]);
        await pool.query("DELETE FROM materials WHERE `id` IN (?)", [materialIds]);
        await pool.query("DELETE FROM household_recipes WHERE recipeId = ?", [recipe.id]);
        await pool.query("DELETE FROM recipes WHERE `id` = ?", [req.body.id]);
        res.json(ApiResponse(true, true))
        return;
    }
    res.json(ApiResponse(true, false)); // TODO: this line maybe shouldn't exist at all. How would you get here?
}

async function clearOldMaterials(pool, recipeId) {
    var preexistingMaterials = await pool.query("SELECT * FROM materials WHERE `recipeId` = ?", [recipeId]);
    if (QueryHadResults(preexistingMaterials)) {
        var preexistingMaterialIds = preexistingMaterials.map((row) => row.id);
        await pool.query("DELETE FROM materials_ingredientgroups WHERE `materialId` IN (?)", [preexistingMaterialIds]); // delete old materials from this recipe so we can save fresh
        await pool.query("DELETE FROM materials WHERE `id` IN (?)", [preexistingMaterialIds]);
    }
}

async function createRecipe(recipe, pool, con, res) {
    con.query("INSERT INTO recipes (`name`, `description`, `calories`, `lastEaten`, `householdId`) \
    VALUES (?, ?, ?, ?, ?)",
        [recipe.name, recipe.description, recipe.calories, recipe.lastEaten, recipe.householdId],
        (err2, ignore) => {
            if (err2) {
                console.log("ERROR while inserting recipe");
                console.log(err2);
                con.release();
                return;
            }
            con.query("SELECT LAST_INSERT_ID()", async (err3, insertedIdRaw) => {
                if (err3) {
                    console.log("ERROR while selecting id of just inserted recipe");
                    console.log(err3);
                    con.release();
                    return;
                }

                var recipeId = insertedIdRaw[0]['LAST_INSERT_ID()'];
                con.release();

                await clearOldMaterials(pool, recipeId);

                var promises = recipe.materials.map((mat) => {
                    return insertUpdateMaterials(mat, pool, recipeId);
                });
                await Promise.all(promises);
                return ApiResponse(true, recipeId)
            });
        });
}


function QueryHadResults(query) {
    return query.length > 0;
}

async function updateRecipe(req, pool, con, res) {

    var existingRecipe = await pool.query("SELECT * FROM recipes WHERE id = ?", [req.body.id]);

    if (QueryHadResults(existingRecipe)) {
        if (existingRecipe[0].householdId !== req.user.householdId) {
            console.log("ERROR user attempted to update a recipe that their household doesn't own");
            con.release();
            return;
        }
    } else {
        console.log("ERROR attempted to update a recipe that hasn't been created yet!");
        con.release();
        return;
    }

    con.query("UPDATE recipes SET `name` = ?, `description` = ?, `calories` = ?, `lastEaten` = ? WHERE `id` = ?",
        [req.body.name, req.body.description, req.body.calories, req.body.lastEaten, req.body.id],
        async (err, results) => {
            if (err) {
                console.log("ERROR while updating existing recipe");
                console.log(err);
                con.release();
            }

            await clearOldMaterials(pool, req.body.id);

            var promises = req.body.materials.map((mat) => {
                return insertUpdateMaterials(mat, pool, req.body.id);
            });
            await Promise.all(promises);
            res.json(ApiResponse(true, req.body.id))

        })
}

async function insertUpdateIngredientGroups(ingredientgroup, pool) {

    if (ingredientgroup.name !== "") {
        let existingGroups = await pool.query("SELECT * FROM ingredientgroups WHERE `name` = ?", [ingredientgroup.name]);
        if (QueryHadResults(existingGroups)) {
            // hook the material up to the existing ingredientgroup
            return existingGroups[0].id;
        } else {
            await pool.query("INSERT INTO ingredientgroups (`name`) VALUES (?)", [ingredientgroup.name]);
            existingGroups = await pool.query("SELECT * FROM ingredientgroups WHERE `name` = ?", [ingredientgroup.name]);
            return existingGroups[0].id;
        }
    }
    return; // NOTE: this may cause a bug depending on how returning null is handled by promise.all
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
            res.json(await Repo.createRecipe(req.body, pool, con, res));
        });
    }
}

var share = (pool) => async (req, res) => {
    // TODO: update the post to this endpoint to only send a household and a recipeId, all else is wasted bandwidth
    var results = await pool.query("SELECT * FROM households WHERE name = ?", [req.body.household])

    if (results.length === 0) {
        console.log("user tried to share recipe with non-existent household");
        res.json(ApiResponse(true, false));
    }

    var householdId = results[0].id

    await pool.query("INSERT INTO household_recipes (`householdId`, `recipeId`) VALUES (?, ?)", [householdId, req.body.id])
    res.json(ApiResponse(true, req.body.id));
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

        return res.send(await Repo.getRecipesByIdList(recipeIds, pool));
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