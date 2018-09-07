
const ApiResponse = require('./apiResponse').ApiResponse

var deleteItem = (db) => (req, res) => {
    db.collection('inventory').remove({ "_id": ObjectId(req.body._id) });
    res.json(ApiResponse(true, null));
}

var post = (db) => (req, res) => {
    req.body._id = ObjectId(req.body._id);
    req.body.household = req.user.household;
    db.collection('inventory').save(req.body, (getErr, result) => {
        if (result.ops) { // this is in the case of an insert, for some reason updates down return a result.ops
            res.json(ApiResponse(true, result.ops[0]._id));
        } else if (result.result.upserted) {
            res.json(ApiResponse(true, result.result.upserted[0]._id));
        } else {
            res.json(ApiResponse(true, req.body._id));
        }
    });
}

var get = (pool) => async (req, res) => {
    try {
        var ingredients = await pool.query("SELECT * from ingredients WHERE householdId = " + req.user.householdId);
        console.log(req.user.householdId);
        res.send(ApiResponse(true, ingredients));
    } 
    catch (err) {
        res.send(ApiResponse(true, []));
    }
}

module.exports.delete = deleteItem;
module.exports.post = post;
module.exports.get = get;