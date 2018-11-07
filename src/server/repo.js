// tslint:disable:no-console
/* tslint:disable:no-string-literal */

const ApiResponse = require('./apiResponse').ApiResponse

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



async function getRecipesByIdList(recipeIds, pool) {
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
    return finalRecipes;
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
}


async function getExistingIngredientById(pool, id) {
    return await pool.query("SELECT ingredients.*, ingredientgroups.name as name FROM ingredients \
            INNER JOIN ingredientgroups \
            ON ingredients.id = ? AND ingredients.ingredientGroupId = ingredientgroups.id", [id]);
}

async function updateIngredientValues(pool, category, statusID, lastPurchased, expires, shelfLife, shoppingQuantity, id, ingredientGroupId) {
    if (ingredientGroupId) {

        return await pool.query("UPDATE ingredients SET \
                        ingredientGroupId = ?, \
                        category = ?, \
                        statusID = ?, \
                        last_purchased = ?, \
                        expires = ?, \
                        shelf_life = ?, \
                        shoppingQuantity = ? \
                        WHERE id = ?",
            [ingredientGroupId, category, statusID, lastPurchased, expires, shelfLife, shoppingQuantity, id]);
    }
    else {
        return await pool.query("UPDATE ingredients SET \
            category = ?, \
            statusID = ?, \
            last_purchased = ?, \
            expires = ?, \
            shelf_life = ?, \
            shoppingQuantity = ? \
            WHERE id = ?",
            [category, statusID, lastPurchased, expires, shelfLife, shoppingQuantity, id]);
    }
}

async function getIngredientGroupbyName(pool, name) {
    let existingGroups = await pool.query("SELECT * FROM ingredientgroups WHERE `name` = ?", [name]);
    return existingGroups;
}

async function updateIngredient(pool, user, ingredient) {
    var existingIngredient = await getExistingIngredientById(pool, ingredient.id)
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
        let existingGroups = await getIngredientGroupbyName(pool, ingredient.name.trim());

        if (existingGroups.length > 0) {
            ingredientGroupId = existingGroups[0].id;
        } else {
            await pool.query("INSERT INTO ingredientgroups (`name`) VALUES (?)", [ingredient.name.trim()]);
            ingredientGroupId = (await getIngredientGroupbyName(pool, ingredient.name.trim()))[0].id;
        }

        await updateIngredientValues(pool, ingredient.category, ingredient.statusID, ingredient.last_purchased, ingredient.expires ? 1 : 0, ingredient.shelf_life, ingredient.shoppingQuantity, ingredient.id, ingredientGroupId);
    } else {
        // just update the ingredient's fields
        await updateIngredientValues(pool, ingredient.category, ingredient.statusID, ingredient.last_purchased, ingredient.expires ? 1 : 0, ingredient.shelf_life, ingredient.shoppingQuantity, ingredient.id)

    }
    return ApiResponse(true, ingredient.id);
}

async function insertIngredientValues(pool, res, ingredientGroupId, category, statusID, lastPurchased, expires, shelfLife, shoppingQuantity, householdId) {
    pool.getConnection((err, con) => {
        con.query("INSERT INTO ingredients (`ingredientGroupId`, `category`, `statusID`, `last_purchased`, `expires`, `shelf_life`, `shoppingQuantity`, `householdId`) \
            VALUES (?, ?, ?, ?, ?, ?, ?) ",
            [ingredientGroupId, category, statusID, lastPurchased, expires, shelfLife, shoppingQuantity, householdId], (err2, ignore) => {
                con.query("SELECT LAST_INSERT_ID()", (err3, insertedIdRaw) => {
                    var ingredientId = insertedIdRaw[0]['LAST_INSERT_ID()'];
                    if (err3) {
                        console.log("ERROR at selecting last insert id after inserting new ingredient");
                        console.log(err3);
                        con.release();
                        res.json(ApiResponse(true, false));
                        return;
                    }
                    con.release();
                    res.json(ApiResponse(true, ingredientId));
                })
            });
    });
}

async function insertIngredient(pool, res, user, ingredient) {
    var ingredientGroupId;

    let existingGroups = await getIngredientGroupbyName(pool, ingredient.name.trim());
    if (existingGroups.length > 0) {
        ingredientGroupId = existingGroups[0].id;
    } else {
        await pool.query("INSERT INTO ingredientgroups (`name`) VALUES (?)", [ingredient.name.trim()]);
        ingredientGroupId = (await getIngredientGroupbyName(pool, ingredient.name.trim()))[0].id;
    }
    return await insertIngredientValues(pool, res, ingredientGroupId, ingredient.category, ingredient.statusID, ingredient.last_purchased, ingredient.expires ? 1 : 0, ingredient.shelf_life, ingredient.shoppingQuantity, user.householdId);
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

                var promises = recipe.materials.map((mat) => {
                    return insertUpdateMaterials(mat, pool, recipeId);
                });
                await Promise.all(promises);
                res.send(ApiResponse(true, recipeId));
                return;
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

async function getRecipeById(pool, recipeId) {
    var results = await getRecipesByIdList([recipeId], pool);
    if (results.length > 0) {
        return results[0];
    } else {
        console.log("WARNING: someone tried to load a non-existent recipe");
        return null;
    }
}

module.exports.constructRecipeFromRows = constructRecipeFromRows;
module.exports.constructMaterialFromRows = constructMaterialFromRows;
module.exports.constructIngredientGroupFromRows = constructIngredientGroupFromRows;
module.exports.getRecipesByIdList = getRecipesByIdList;
module.exports.linkMaterialIngredientGroups = linkMaterialIngredientGroups;
module.exports.insertUpdateMaterials = insertUpdateMaterials;
module.exports.getExistingIngredientById = getExistingIngredientById;
module.exports.updateIngredientValues = updateIngredientValues;
module.exports.updateIngredient = updateIngredient;
module.exports.insertIngredientValues = insertIngredientValues;
module.exports.insertIngredient = insertIngredient;
module.exports.clearOldMaterials = clearOldMaterials;
module.exports.createRecipe = createRecipe;
module.exports.QueryHadResults = QueryHadResults;
module.exports.updateRecipe = updateRecipe;
module.exports.insertUpdateIngredientGroups = insertUpdateIngredientGroups;
module.exports.getRecipeById = getRecipeById;