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
const RecipeApi = require('recipeApi');
const InventoryApi = require('inventoryApi');
const InventoryApi = require('photosApi');
const https = require('https');
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
  app.use(express.static('public'));
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


  // RECIPES
  app.get('/api/recipes', passport.authenticationMiddleware(), RecipeApi.get);
  app.delete('/api/recipes', passport.authenticationMiddleware(), RecipeApi.delete);
  app.post('/api/recipes', passport.authenticationMiddleware(), RecipeApi.post);
  app.post('/api/recipes/share', passport.authenticationMiddleware(), RecipeApi.share);

  // PHOTOS
  app.get('/api/photos', passport.authenticationMiddleware(), PhotosApi.get);
  app.post('/api/photos', passport.authenticationMiddleware(), PhotosApi.post);
  app.delete('/api/photos', passport.authenticationMiddleware(), PhotosApi.delete);

  // INVENTORY
  app.get('/api/inventory', passport.authenticationMiddleware(), InventoryApi.get);
  app.post('/api/inventory', passport.authenticationMiddleware(), InventoryApi.post);
  app.delete('/api/inventory', passport.authenticationMiddleware(), InventoryApi.delete);

  app.get('/api/householdMembers', passport.authenticationMiddleware(), (req, res) => {
    db.collection('users').find({ household: req.user.household }).toArray((geterr, items) => {
      console.log(items.map((user) => { return user.user }));
      res.send(ApiResponse(true, items.map((user) => { return user.user })));
    });
  });

  // USERS
  app.post('/api/login', passport.authenticate('local'), UsersApi.login);
  app.post('/api/createAccount', UsersApi.createAccount);
  app.get('/api/logout', UsersApi.logout);

  app.post('/api/newIssue',
    (req, res) => {
      if (!req.body.title || !req.body.body) {
        res.json(ApiResponse(true, 'Missing Field'))
      }
      else {
        var token = process.env.BUG_TRACKER_TOKEN
        var options = {
          host: "api.github.com",
          path: "/repos/milesvdw/vandewberry/issues",
          method: "POST",
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': 'token ' + token,
            'User-Agent': 'vandewberryBugReporter',
          }
        }
        var request = https.request(options, function (res2) {
          var responseString = "";
          res2.on("data", function (data) {
            responseString += data;
          })
          res2.on("end", function () {
            // console.log(responseString);
          })
        })
        var payload = {
          title: req.body.title,
          body: req.body.body,
        };
        request.write(JSON.stringify(payload));
        request.end();
        res.json(ApiResponse(true, 'Bug Submitted Successfully'));
      }
    }
  );

  app.get('/api/checkSession', authenticationMiddleware(), (req, res, next) => {
    res.json(ApiResponse(true, req.user.user));
  })

  app.listen(port, () => console.log(`Listening on port ${port}`));

});

var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "yourusername",
  password: "yourpassword"
});

con.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
});