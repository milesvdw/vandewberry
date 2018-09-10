const ApiResponse = require('./apiResponse').ApiResponse
const utils = require('../utils/utils')

var deleteRecipe = (db) => (req, res) => {
    db.collection('recipes').remove({ "_id": ObjectId(req.body._id) });
    res.json(ApiResponse(true, null));
}

function createRecipe(req, pool, con, res) {
    con.query("INSERT INTO recipes (`name`, `description`, `calories`, `lastEasten`, `householdId`) \
    VALUES (?, ?, ?, ?, ?)",
        [req.body.name, req.body.description, req.body.calories, req.body.lastEaten, req.user.householdId],
        (err2, ignore) => {
            con.query("SELECT LAST_INSERT_ID()", (err3, insertedIdRaw) => {
                var recipeId = insertedIdRaw[0]['LAST_INSERT_ID()'];
                con.release();
                createRecipeMaterials(req, pool, recipeId, res);
            });
        });
}

function createRecipeMaterials(req, pool, recipeId, res) {
    
}

var post = (pool) => (req, res) => {
    if (req.body.id > 0) {
        // do an update
        await pool.query("SELECT * FROM recipes");
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
    req.body._id = ObjectId(req.body._id);
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



var get = (pool) => (req, res) => {
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