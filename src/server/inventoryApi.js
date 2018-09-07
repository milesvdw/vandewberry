var deleteItem = (req, res) => {
    db.collection('inventory').remove({ "_id": ObjectId(req.body._id) });
    res.json(ApiResponse(true, null));
}

var post = (req, res) => (req, res) => {
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

var get = (req, res) => {
    db.collection('inventory').find({ household: req.user.household }).toArray((geterr, items) => {
        res.send(ApiResponse(true, items));
    });
}

module.exports.share = share;
module.exports.delete = deleteItem;
module.exports.post = post;
module.exports.get = get;