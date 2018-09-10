const ApiResponse = require('./apiResponse').ApiResponse
const utils = require('../utils/utils')

var deleteRecipe = (db) => (req, res) => {
    db.collection('recipes').remove({ "_id": ObjectId(req.body._id) });
    res.json(ApiResponse(true, null));
}

var post = (pool) => (req, res) => {
    req.body._id = ObjectId(req.body._id);
    req.body.household = req.user.household;
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

function constructRecipeFromRows(rows) {
    //expects a list of rows, with each row having one unique recipe-material-ingredientgroup-ingredient combination
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