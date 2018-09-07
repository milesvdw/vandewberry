const ApiResponse = require('./apiResponse').ApiResponse

var deleteRecipe = (db) => (req, res) => {
    db.collection('recipes').remove({ "_id": ObjectId(req.body._id) });
    res.json(ApiResponse(true, null));
}

var post = (db) => (req, res) => {
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

var share = (db) => (req, res) => {
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

var get = (db) => (req, res) => {
    db.collection('recipes').find({ household: req.user.household }).toArray((geterr, items) => {
        res.send(ApiResponse(true, items));
    });
}

module.exports.share = share;
module.exports.delete = deleteRecipe;
module.exports.post = post;
module.exports.get = get;