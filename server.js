// tslint:disable:no-console
const express = require('express');
var ObjectId = require('mongodb').ObjectID;
const app = express();
let bodyParser = require('body-parser');
// parse application/json
app.use(bodyParser.json());

const port = 5001; // process.env.PORT || 
const uri = process.env.MONGODB_URI;
const MongoClient = require('mongodb').MongoClient;


MongoClient.connect(uri, (err, client) => {
  if (err) {
    throw err;
  }

  let db = client.db('heroku_6ftkk7t9');

  app.get('/api/inventory', (req, res) => {
    db.collection('inventory').find().toArray((geterr, items) => {
      console.log(items);
      res.send(items);
    });
  });

  app.post('/api/inventory', (req, res) => {
    req.body._id = ObjectId(req.body._id);
    db.collection('inventory').save(req.body, (getErr, result) => {
      if (result.ops) { // this is in the case of an insert, for some reason updates down return a result.ops
        console.log(result.ops[0]._id)
        res.json(result.ops[0]._id);
      } else if (result.result.upserted) {
        console.log(result.result.upserted[0]._id)
        res.json(result.result.upserted[0]._id);
      } else {
        console.log(req.body._id)
        res.json(req.body._id);
      }
    });
  });

  app.delete('/api/recipes', (req, res) => {
    db.collection('recipes').remove({ "_id": ObjectId(req.body._id) });
    res.send();
  });

  app.post('/api/recipes', (req, res) => {
    req.body._id = ObjectId(req.body._id);
    db.collection('recipes').save(req.body, (getErr, result) => {
      if (result.ops) { // this is in the case of an insert, for some reason updates down return a result.ops
        res.json(result.ops[0]._id);
      } else if (result.result.upserted) {
        res.json(result.result.upserted[0]._id);
      } else {
        res.json(req.body._id);
      }
    });
  });

  app.get('/api/recipes', (req, res) => {
    db.collection('recipes').find().toArray((geterr, items) => {
      res.send(items);
    });
  });

  app.listen(port, () => console.log(`Listening on port ${port}`));

});