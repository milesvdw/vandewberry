const ApiResponse = require('./apiResponse').ApiResponse
// const utils = require('../utils/utils')

var deleteRecipe = (db) => (req, res) => {
    db.collection('recipes').remove({ "_id": ObjectId(req.body._id) });
    res.json(ApiResponse(true, null));
}

function createRecipe(req, pool, con, res) {
    con.query("INSERT INTO recipes (`name`, `description`, `calories`, `lastEasten`, `householdId`) \
    VALUES (?, ?, ?, ?, ?)",
        [req.body.name, req.body.description, req.body.calories, req.body.lastEaten, req.user.householdId],
        (err2, ignore) => {
            if (err2) {
                console.log("ERROR while inserting recipe");
                console.log(err2);
                con.release();
                return;
            }
            con.query("SELECT LAST_INSERT_ID()", (err3, insertedIdRaw) => {
                var recipeId = insertedIdRaw[0]['LAST_INSERT_ID()'];
                con.release();

                insert_update_materials(pool, req, recipeId, 0, () => {
                    res.json(ApiResponse(true, recipeId))
                })
            });
        });
};

function updateRecipe(req, pool, con, cb) {
    con.query("UPDATE recipes SET `name` = ?, `description` = ?, `calories` = ?, `lastEaten` = ? `WHERE `id` = ?",
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

function insert_update_ingredientGroups(pool, material, index, cb, groupIds = []) {
    if (index == material.ingredientgroups.length) {
        cb(groupIds); // no ingredientgroups left to add
        return;
    }

    var ingredientGroup = material.ingredientgroups[index];
    if (ingredientGroup.name != "") {
        let existingGroups = await pool.query("SELECT * FROM ingredientgroups WHERE `name` = ?", [ingredientGroup.name]);
        if (existingGroups.length > 0) {
            // hook the material up to the existing ingredientgroup
            groupIds.push(existingGroups[0].id);
            return insert_update_ingredientGroups(pool, material, index + 1, cb, groupIds);
        } else {
            await pool.query("INSERT INTO ingredientgroups (`name`) VALUES (?)", [ingredientGroup.name]);
            let existingGroups = await pool.query("SELECT * FROM ingredientgroups WHERE `name` = ?", [ingredientGroup.name]);
            groupIds.push(existingGroups[0].id);
            return insert_update_ingredientGroups(pool, material, index + 1, cb, groupIds);
        }

    }
    insert_update_ingredientGroups(pool, material, index + 1, cb, groupIds);
}

function link_material_ingredientGroups(groupIds, materialId, con) {
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

function insert_update_materials(pool, req, recipeId, index, cb) {
    if (index === req.body.materials.length) {
        cb();
        return;
    }
    var material = req.body.materials[index];
    // first insert the ingredient groups
    if (material.id > 0) {
        // drop existing material_ingredientgroup connections
        await pool.query("DELETE FROM materials_ingredientgroups WHERE materialId = ?", [material.id]);
    }
    insert_update_ingredientGroups(pool, material, 0, (groupIds) => {
        if (groupIds.length == 0) return; // no ingredients to link this material to...
        pool.getConnection((err, con) => {
            con.query("INSERT INTO materials (`recipeId`, `quantity`, `required`) VALUES (?, ?, ?)", [recipeId, req.body.quantity, req.body.required ? 1 : 0], (err, ignore) => {
                if (err) {
                    console.log("ERROR while inserting new material");
                    console.log(err);
                    con.release();
                    return;
                }
                con.query("SELECT LAST_INSERT_ID()", (err2, insertedIdRaw) => {
                    if (err2) {
                        console.log("ERROR at selecting last insert id after inserting new material");
                        console.log(err2);
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

var share = (pool) => (req, res) => {
    // TODO: req now has a 'household' which is different from a 'householdId' which will be used for sharing

    db.collection('recipes').save(req.body, (getErr, result) => {
        if (result.ops) { // this is in the case of an insert, for some reason updates down return a result.ops
            res.json(ApiResponse(true, result.ops[0]._id));
        } else if (result.result.upserted) {
            res.json(ApiResponse(true, result.result.upserted[0]._id));
        } else {
            res.json(ApiResponse(true, req.body._id));
        }
    });
}

function constructMaterialFromRows(rows) {
    material = {}
    material.id = rows[0]['materials.id']
    material.quantity = rows[0]['materials.quantity']
    material.required = rows[0]['materials.required']

    let ingredientgroupids = rows.map((r) => r['ingredientgroups.id']) // non-unique list of recipe ids
    ingredientIds = ingredientIds.unique();

    material.ingredients = []
    ingredientIds.forEach((id) =>
        recipe.materials.push(constructMaterialFromRows(rows.filter((row) =>
            row['materials.id'] === id))))

}

function constructRecipeFromRows(rows) {
    //expects a list of rows, with each row having one unique recipe-material-ingredientgroup-ingredient combination
    recipe = {};
    recipe.id = rows[0]['recipes.id'];
    recipe.description = rows[0]['recipes.description'] // NOTE: I'm probably sending over duplicate descriptions which could get expensive idk
    recipe.name = rows[0]['recipes.name']
    recipe.calories = rows[0]['recipes.calories']
    recipe.lastEaten = rows[0]['recipes.lastEaten']
    recipe.householdId = rows[0]['recipes.householdId']

    let materialIds = rows.map((r) => r['materials.id']) // non-unique list of recipe ids
    materialIds = materialIds.unique();
    recipe.materials = []
    materialIds.forEach((id) =>
        recipe.materials.push(constructMaterialFromRows(rows.filter((row) =>
            row['materials.id'] === id))))
}



var get = (pool) => async (req, res) => {
    try {
        var sqlRecipes = await pool.query("SELECT * FROM recipes \
        LEFT JOIN materials ON materials.recipeId = recipes.id \
        LEFT JOIN materials_ingredientgroups ON materials_ingredientgroups.materialId = materials.id \
        LEFT JOIN ingredientgroups ON materials_ingredientgroups.ingredientGroupId = ingredientgroups.id \
        LEFT JOIN ingredients ON ingredients.ingredientGroupId = ingredientgroups.id \
        WHERE recipes.householdId = ? \
        AND \
        ingredients.householdId = ?", [req.user.householdId, req.user.householdId]);

        let recipeIds = sqlRecipes.map((r) => r['recipes.id']) // non-unique list of recipe ids
        recipeIds = recipeIds.unique();

        let finalRecipes = [];
        recipeIds.forEach((rId) => {
            finalRecipes.push(constructRecipeFromRows(sqlRecipes.filter((row) => row['recipes.id'] === rId)))
        })

        res.send(ApiResponse(true, recipes));
    }
    catch (err) {
        res.send(ApiResponse(true, []));
    }
}

module.exports.share = share;
module.exports.delete = deleteRecipe;
module.exports.post = post;
module.exports.get = get;