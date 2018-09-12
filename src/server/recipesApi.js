// tslint:disable:no-console
/* tslint:disable:no-string-literal */
var mysql = require('mysql');
const ApiResponse = require('./apiResponse').ApiResponse
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

async function createRecipe(req, pool, con, res) {
    con.query("INSERT INTO recipes (`name`, `description`, `calories`, `lastEaten`, `householdId`) \
    VALUES (?, ?, ?, ?, ?)",
        [req.body.name, req.body.description, req.body.calories, req.body.lastEaten, req.user.householdId],
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

                var promises = req.body.materials.map((mat) => {
                    return insertUpdateMaterials(mat, pool, recipeId);
                });
                await Promise.all(promises);
                res.json(ApiResponse(true, recipeId))
            });
        });
};


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

async function linkMaterialIngredientGroups(gid, materialId, con) {
    con.query("INSERT INTO materials_ingredientgroups (`materialId`, `ingredientGroupId`) VALUES (?, ?)", [materialId, gid], (err, ignore) => {
        if (err) {
            console.log("ERROR while linking new material to ingredientgroup");
            console.log(err);
            con.release();
            return;
        }
    })
}

async function insertUpdateMaterials(material, pool, recipeId) {
    var hasIngredients = material.ingredientgroups.length > 0 && !!material.ingredientgroups[0].name;
    if (!hasIngredients) {
        console.log("WARNING: user tried to create a material with no ingredients");
        return;
    }

    // first insert the ingredient groups
    if (material.id > 0) {
        // drop existing material_ingredientgroup connections
        await pool.query("DELETE FROM materials_ingredientgroups WHERE materialId = ?", [material.id]);
        await pool.query("DELETE FROM materials WHERE id = ?", [material.id]);
    }

    var promises = material.ingredientgroups.map((ig) => {
        return insertUpdateIngredientGroups(ig, pool)
    })

    var groupIds = await Promise.all(promises);

    if (groupIds.length === 0) {
        return; // no ingredients to link this material to...
    }
    pool.getConnection((err, con) => {
        if (err) {
            console.log("ERROR: getting connection to insert materials");
            console.log(err);
            return;
        }
        con.query("INSERT INTO materials (`recipeId`, `quantity`, `required`) VALUES (?, ?, ?)", [recipeId, material.quantity, material.required ? 1 : 0], (err2, ignore) => {
            if (err2) {
                console.log("ERROR while inserting new material");
                console.log(err2);
                con.release();
                return;
            }
            con.query("SELECT LAST_INSERT_ID()", async (err3, insertedIdRaw) => {
                if (err3) {
                    console.log("ERROR at selecting last insert id after inserting new material");
                    console.log(err3);
                    con.release();
                    return;
                }
                var materialId = insertedIdRaw[0]['LAST_INSERT_ID()']
                await Promise.all(groupIds.map((gid) => {
                    return linkMaterialIngredientGroups(gid, materialId, con)
                }))
                con.release();
            })
        })
    });

    return;
};


var post = (pool) => async (req, res) => {
    if(!req.body.name || req.body.name.length < 1) {
        console.log("User tried to save a recipe with an empty name. Shame on them, their family, and their dog.");
        res.json(ApiResponse(true, false));
        return;
    }
    if (req.body.id > 0) {
        // do an update
        pool.getConnection((err, con) => {
            updateRecipe(req, pool, con, res);
        });
    }
    else {
        // do an insert
        pool.getConnection((err, con) => {
            createRecipe(req, pool, con, res);
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

function constructRecipeFromRows(rows) {
    //expects a list of rows, with each row having one unique recipe-material-ingredientgroup-ingredient combination
    recipe = {};
    recipe.id = rows[0].recipeId;
    recipe.description = rows[0].recipeDescription // NOTE: I'm probably sending over duplicate descriptions which could get expensive idk
    recipe.name = rows[0].recipeName
    recipe.calories = rows[0].recipeCalories
    recipe.lastEaten = rows[0].lastEaten
    recipe.householdId = rows[0].householdId

    let materialIds = rows.map((r) => r.materialId).unique(); // non-unique list of recipe ids
    recipe.materials = []
    materialIds.forEach((id) =>
        recipe.materials.push(constructMaterialFromRows(rows.filter((row) =>
            row.materialId === id))))
    return recipe;
}

function constructMaterialFromRows(rows) {
    material = {}
    material.id = rows[0].materialId
    material.quantity = rows[0].materialQuantity
    material.required = rows[0].materialRequired
    let ingredientgroupIds = rows.map((r) => r.ingredientGroupId) // non-unique list of recipe ids
    ingredientgroupIds = ingredientgroupIds.unique();

    material.ingredientgroups = []
    ingredientgroupIds.forEach((id) =>
        material.ingredientgroups.push(constructIngredientGroupFromRows(rows.filter((row) =>
            row.ingredientGroupId === id))))
    return material;
}

function constructIngredientGroupFromRows(rows) {
    ingredientGroup = {};
    ingredientGroup.id = rows[0].ingredientGroupId;
    ingredientGroup.name = rows[0].ingredientGroupName;

    return ingredientGroup;
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

        var sqlRecipes = await pool.query("SELECT recipes.id AS recipeId, \
        recipes.description AS recipeDescription, \
        recipes.name AS recipeName, \
        recipes.calories AS recipeCalories, \
        recipes.lastEaten AS recipeLastEaten, \
        recipes.householdId AS householdId, \
        materials.id AS materialId, \
        materials.quantity AS materialQuantity, \
        materials.required AS materialRequired, \
        ingredientgroups.id AS ingredientGroupId, \
        ingredientgroups.name AS ingredientGroupName \
        FROM recipes \
        LEFT JOIN materials ON materials.recipeId = recipes.id \
        LEFT JOIN materials_ingredientgroups ON materials_ingredientgroups.materialId = materials.id \
        LEFT JOIN ingredientgroups ON materials_ingredientgroups.ingredientGroupId = ingredientgroups.id \
        WHERE recipes.id IN (?)", [recipeIds]);

        let finalRecipes = [];
        recipeIds.forEach((rId) => {
            finalRecipes.push(constructRecipeFromRows(sqlRecipes.filter((row) => row['recipeId'] === rId))) // // TODO: this results in duplicate work as we filter this list several times, should be optimized 
        })
        res.send(ApiResponse(true, finalRecipes));
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