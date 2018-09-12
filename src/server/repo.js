// tslint:disable:no-console
/* tslint:disable:no-string-literal */

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
    return ApiResponse(true, finalRecipes);
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
}


async function getExistingIngredientById(id) {
    return await pool.query("SELECT ingredients.*, ingredientgroups.name as name FROM ingredients \
            INNER JOIN ingredientgroups \
            ON ingredients.id = ? AND ingredients.ingredientGroupId = ingredientgroups.id", [id]);
}

async function updateIngredientValues(category, statusID, expires, shelfLife, id, ingredientGroupId) {
    if (ingredientGroupid) {

        return await pool.query("UPDATE ingredients SET \
                        ingredientGroupId = ?, \
                        category = ?, \
                        statusID = ?, \
                        expires = ?, \
                        shelf_life = ? \
                        WHERE id = ?",
            [ingredientGroupId, category, statusID, expires, shelfLife, id]);
    }
    else {
        return await pool.query("UPDATE ingredients SET \
            category = ?, \
            statusID = ?, \
            expires = ?, \
            shelf_life = ? \
            WHERE id = ?",
            [category, statusID, expires, shelfLife, id]);
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

async function insertIngredientValues(ingredientGroupId, category, statusID, expires, shelfLife, householdId) {
    pool.getConnection((err, con) => {
        con.query("INSERT INTO ingredients (`ingredientGroupId`, `category`, `statusID`, `expires`, `shelf_life`, `householdId`) \
            VALUES (?, ?, ?, ?, ?, ?) ",
            [ingredientGroupId, category, statusID, expires, shelfLife, householdId], (err2, ignore) => {
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
module.exports.getIngredientGroupbyName = getIngredientGroupbyName;