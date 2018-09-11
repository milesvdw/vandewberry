// tslint:disable:no-console
const ApiResponse = require('./apiResponse').ApiResponse
// const utils = require('../utils/utils')

var deleteRecipe = (pool) => async (req, res) => {
    var existingData = await pool.query("SELECT * FROM recipes LEFT JOIN materials ON materials.recipeId = recipes.id \
    WHERE recipes.id = ?", [req.body.id]);

    if (existingData.length === 0) {
        console.log("ERROR: attempted to delete a recipe that doesn't exist");
        res.json(ApiResponse(true, false));
    } else if (existingData[0]['recipes.householdId'] !== req.user.householdId) {
        console.log("ERROR: attempted to delete a recipe that the user doesn't own");
        res.json(ApiResponse(true, false));
    } else {
        var materialIds = existingData.map((row) => row['materials.id']).unique();
        await pool.query("DELETE FROM materials_ingredientgroups WHERE materialId IN (?)", [materialIds]);
        await pool.query("DELETE FROM materials WHERE `id` IN (?)", [materialIds]);
        await pool.query("DELETE FROM recipes WHERE `id` = ?", [req.body.id])
        res.json(ApiResponse(true, true))
    }
    res.json(ApiResponse(true, false)); // TODO: this line maybe shouldn't exist at all. How would you get here?
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

                var preexistingMaterials = await pool.query("SELECT * FROM materials WHERE `recipeId` = ?", [recipeId]);
                if(preexistingMaterials.length > 0) {
                    var preexistingMaterialIds = preexistingMaterials.map((row) => row.id);
                    await pool.query("DELETE FROM materials_ingredientgroups WHERE `materialId` IN (?)", [preexistingMaterialIds]); // delete old materials from this recipe so we can save fresh
                    await pool.query("DELETE FROM materials WHERE `materialId` IN (?)", [preexistingMaterialIds]);
                }
                insert_update_materials(pool, req, recipeId, 0, () => {
                    res.json(ApiResponse(true, recipeId))
                })
            });
        });
};

async function updateRecipe(req, pool, con, res) {
    var existingRecipe = await pool.query("SELECT * FROM recipes WHERE id = ?", [req.body.id]);
    if (existingRecipe.length > 0) {
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
        (err, results) => {
            if (err) {
                console.log("ERROR while updating existing recipe");
                console.log(err);
                con.release();
            }
            insert_update_materials(pool, req, req.body.id, 0, () => {
                res.json(ApiResponse(true, recipeId))
            })

        })
}

async function insert_update_ingredientGroups(pool, material, index, cb, groupIds = []) {
    if (index === material.ingredientgroups.length) {
        cb(groupIds); // no ingredientgroups left to add
        return;
    }

    var ingredientGroup = material.ingredientgroups[index];
    if (ingredientGroup.name !== "") {
        let existingGroups = await pool.query("SELECT * FROM ingredientgroups WHERE `name` = ?", [ingredientGroup.name]);
        if (existingGroups.length > 0) {
            // hook the material up to the existing ingredientgroup
            groupIds.push(existingGroups[0].id);
            return insert_update_ingredientGroups(pool, material, index + 1, cb, groupIds);
        } else {
            await pool.query("INSERT INTO ingredientgroups (`name`) VALUES (?)", [ingredientGroup.name]);
            existingGroups = await pool.query("SELECT * FROM ingredientgroups WHERE `name` = ?", [ingredientGroup.name]);
            groupIds.push(existingGroups[0].id);
            return insert_update_ingredientGroups(pool, material, index + 1, cb, groupIds);
        }

    }
    insert_update_ingredientGroups(pool, material, index + 1, cb, groupIds);
}

async function link_material_ingredientGroups(groupIds, materialId, con) {
    if (groupIds.length > 0) {
        let groupId = groupIds.pop();
        con.query("INSERT INTO materials_ingredientgroups (`materialId`, `ingredientGroupId`) VALUES (?, ?)", [materialId, groupId], (err, ignore) => {
            if (err) {
                console.log("ERROR while linking new material to ingredientgroup");
                console.log(err);
                con.release();
                return;
            } else {
                link_material_ingredientGroups(groupIds, materialId, con);
            }
        })
    } else {
        con.release();
        return;
    }
}

async function insert_update_materials(pool, req, recipeId, index, cb) {
    if (index === req.body.materials.length) {
        cb();
        return;
    }
    var material = req.body.materials[index];
    // first insert the ingredient groups
    if (material.id > 0) {
        // THIS SHOULD NEVER HAPPEN
        console.log("ERROR! Expected material to be saved new, but this one already has an id!");
        // drop existing material_ingredientgroup connections
        await pool.query("DELETE FROM materials_ingredientgroups WHERE materialId = ?", [material.id]);
    }
    insert_update_ingredientGroups(pool, material, 0, (groupIds) => {
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
                con.query("SELECT LAST_INSERT_ID()", (err3, insertedIdRaw) => {
                    if (err3) {
                        console.log("ERROR at selecting last insert id after inserting new material");
                        console.log(err3);
                        con.release();
                        return;
                    }
                    link_material_ingredientGroups(groupIds, insertedIdRaw[0]['LAST_INSERT_ID()'], con)
                })
            })
        });
    });
    insert_update_materials(pool, req, recipeId, index + 1, cb);
};


var post = (pool) => async (req, res) => {
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

    // db.collection('recipes').save(req.body, (getErr, result) => {
    //     if (result.ops) { // this is in the case of an insert, for some reason updates down return a result.ops
    //         res.json(ApiResponse(true, result.ops[0]._id));
    //     } else if (result.result.upserted) {
    //         res.json(ApiResponse(true, result.result.upserted[0]._id));
    //     } else {
    //         res.json(ApiResponse(true, req.body._id));
    //     }
    // });
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
    console.log(materialIds)
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
        WHERE recipes.householdId = ?", [req.user.householdId]);
        let recipeIds = sqlRecipes.map((r) => r['recipes.id']) // non-unique list of recipe ids
        recipeIds = recipeIds.unique();

        let finalRecipes = [];
        recipeIds.forEach((rId) => {
            finalRecipes.push(constructRecipeFromRows(sqlRecipes.filter((row) => row['recipes.id'] === rId))) // // TODO: this results in duplicate work as we filter this list several times, should be optimized 
        })
        res.send(ApiResponse(true, finalRecipes));
    }
    catch (err) {
        res.send(ApiResponse(true, []));
    }
}

module.exports.share = share;
module.exports.delete = deleteRecipe;
module.exports.post = post;
module.exports.get = get;