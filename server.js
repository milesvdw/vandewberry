// tslint:disable:no-console
const express = require('express');
const ObjectId = require('mongodb').ObjectID;
const passport = require('passport')
const bcrypt = require('bcrypt')
const LocalStrategy = require('passport-local').Strategy
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoClient = require('mongodb').MongoClient;
const MongoStore = require('connect-mongo')(session)
// parse application/json

// TODO: Salting technique
// const saltRounds = 10
// const myPlaintextPassword = 'foobar'
// const salt = bcrypt.genSaltSync(saltRounds)
// const passwordHash = bcrypt.hashSync(myPlaintextPassword, salt)

const app = express();




let ApiResponse = (authenticated, payload) => {
  return { authenticated, payload };
}


let port = 5001; // process.env.PORT || 

const uri = process.env.MONGODB_URI;

let testProd = false;

let authenticationMiddleware = () => {
  return function (req, res, next) {
    if (req.isAuthenticated()) {
      return next()
    }
    res.json(ApiResponse(false, null));
  }
}


if (process.env.NODE_ENV === 'production' || testProd) {
  app.use(express.static('build'));
  port = process.env.PORT || 5000;
}

MongoClient.connect(uri, (err, client) => {
  if (err) {
    throw err;
  }

  let db = client.db('heroku_6ftkk7t9');

  app.use(session({
    secret: process.env.SECRET,
    // store: new MongoStore({
    //   db
    // })
  }))

  app.use(bodyParser.json());
  app.use(passport.initialize())
  app.use(passport.session())



  passport.use(new LocalStrategy(
    async (username, password, done) => {
      users = await db.collection('users').find({ user: username }).toArray()

      if (users.length === 1) {
        // Always use hashed passwords and fixed time comparison
        bcrypt.compare(password, users[0].passwordHash, (cryptErr, isValid) => {
          if (cryptErr) {
            return done(cryptErr)
          }
          if (!isValid) {
            return done(null, false)
          }
          return done(null, users[0])
        })
      } else {

        return done(null, false)

      }
    }))

  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser(async (id, done) => {
    users = await db.collection('users').find({ _id: ObjectId(id) }).toArray()
    done(err, users[0]);
  });

  passport.authenticationMiddleware = authenticationMiddleware

  app.get('/api/photos', passport.authenticationMiddleware(), (req, res) => {
    db.collection('photos').find().toArray((geterr, items) => {
      res.send(ApiResponse(true, items));
    });
  });

  app.get('/api/inventory', passport.authenticationMiddleware(), (req, res) => {
    db.collection('inventory').find().toArray((geterr, items) => {
      res.send(ApiResponse(true, items));
    });
  });

  app.post('/api/inventory', passport.authenticationMiddleware(), (req, res) => {
    req.body._id = ObjectId(req.body._id);
    db.collection('inventory').save(req.body, (getErr, result) => {
      if (result.ops) { // this is in the case of an insert, for some reason updates down return a result.ops
        res.json(ApiResponse(true, result.ops[0]._id));
      } else if (result.result.upserted) {
        res.json(ApiResponse(true, result.result.upserted[0]._id));
      } else {
        res.json(ApiResponse(true, req.body._id));
      }
    });
  });

  app.post('/api/photos', passport.authenticationMiddleware(), (req, res) => {
    req.body._id = ObjectId(req.body._id);
    db.collection('photos').save(req.body, (getErr, result) => {
      if (result.ops) { // this is in the case of an insert, for some reason updates down return a result.ops
        res.json(ApiResponse(true, result.ops[0]._id));
      } else if (result.result.upserted) {
        res.json(ApiResponse(true, result.result.upserted[0]._id));
      } else {
        res.json(ApiResponse(true, req.body._id));
      }
    });
  });

  app.delete('/api/inventory', passport.authenticationMiddleware(), (req, res) => {
    db.collection('inventory').remove({ "_id": ObjectId(req.body._id) });
    res.json(ApiResponse(true, null));
  });
  
  app.delete('/api/photos', passport.authenticationMiddleware(), (req, res) => {
    db.collection('photos').remove({ "_id": ObjectId(req.body._id) });
    res.json(ApiResponse(true, null));
  });

  app.delete('/api/recipes', passport.authenticationMiddleware(), (req, res) => {
    db.collection('recipes').remove({ "_id": ObjectId(req.body._id) });
    res.json(ApiResponse(true, null));
  });

  app.post('/api/recipes', passport.authenticationMiddleware(), (req, res) => {
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
  });

  app.get('/api/photos', passport.authenticationMiddleware(), (req, res) => {
    db.collection('photos').find().toArray((geterr, items) => {
      res.send(ApiResponse(true, items));
    });
  });

  app.get('/api/recipes', passport.authenticationMiddleware(), (req, res) => {
    db.collection('recipes').find().toArray((geterr, items) => {
      res.send(ApiResponse(true, items));
    });
  });

  app.post('/api/login',
    passport.authenticate('local'),
    (req, res) => {
      res.send(ApiResponse(true, null))
    }
  );

  app.get('/api/logout',
    (req, res, next) => {
      req.logout();
      req.session.destroy(function (logerr) {
        if (!logerr) {
          res.clearCookie('connect.sid').send();
        } else {
          res.send();
        }

      });
    }
  );

  app.get('/api/checkSession', authenticationMiddleware(), (req, res, next) => {
    res.json(ApiResponse(true, req.user.name));
  })

  app.listen(port, () => console.log(`Listening on port ${port}`));

});