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
const RecipeApi = require('./recipesApi');
const InventoryApi = require('./inventoryApi');
const PhotosApi = require('./photosApi');
const UsersApi = require('./usersApi');
const ApiResponse = require('./apiResponse').ApiResponse
const https = require('https');
var mysql = require('mysql');
var util = require('util')
// parse application/json

// TODO: Salting technique
// const saltRounds = 10
// const myPlaintextPassword = 'foobar'
// const salt = bcrypt.genSaltSync(saltRounds)
// const passwordHash = bcrypt.hashSync(myPlaintextPassword, salt)

const app = express();

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

var connectionConfig = {
  connectionLimit: 9,
  host: process.env.DATABASE_URL,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: "heroku_bbb26e4d4bb66eb",
  port: '3306'
}

const pool = mysql.createPool(connectionConfig)
pool.getConnection((err, connection) => {
  if (err) {
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('Database connection was closed.')
    }
    if (err.code === 'ER_CON_COUNT_ERROR') {
      console.error('Database has too many connections.')
    }
    if (err.code === 'ECONNREFUSED') {
      console.error('Database connection was refused.')
    }
  }
  if (connection) connection.release()
  return
})
pool.query = util.promisify(pool.query) // dark magic

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

      try {
        var users = await pool.query("SELECT * from users WHERE username = \'" + username + "'");
        console.log(users);
        if (users.length === 1) {
          // Always use hashed passwords and fixed time comparison
          bcrypt.compare(password, users[0].password, (cryptErr, isValid) => {
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
      } catch (err) {
        throw new Error(err)
      }

      connection.end();
    }))

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    var users = await pool.query("SELECT * from users WHERE id = \'" + id + "'");
    done(err, users[0]);
  });

  passport.authenticationMiddleware = authenticationMiddleware


  // RECIPES
  app.get('/api/recipes', passport.authenticationMiddleware(), RecipeApi.get(db));
  app.delete('/api/recipes', passport.authenticationMiddleware(), RecipeApi.delete(db));
  app.post('/api/recipes', passport.authenticationMiddleware(), RecipeApi.post(db));
  app.post('/api/recipes/share', passport.authenticationMiddleware(), RecipeApi.share(db));

  // PHOTOS
  app.get('/api/photos', passport.authenticationMiddleware(), PhotosApi.get(db));
  app.post('/api/photos', passport.authenticationMiddleware(), PhotosApi.post(db));
  app.delete('/api/photos', passport.authenticationMiddleware(), PhotosApi.delete(db));

  // INVENTORY
  app.get('/api/inventory', passport.authenticationMiddleware(), InventoryApi.get(db));
  app.post('/api/inventory', passport.authenticationMiddleware(), InventoryApi.post(db));
  app.delete('/api/inventory', passport.authenticationMiddleware(), InventoryApi.delete(db));
 
  app.get('/api/householdMembers', passport.authenticationMiddleware(), async (req, res) => {
    try {
      var users = await pool.query("SELECT * from users WHERE householdId = \'" + req.user.householdId + "'");
      res.send(ApiResponse(true, users.map((user) => { return user.username })));
    } catch (err) {
      throw new Error(err)
    }
  });

  // USERS
  app.post('/api/login', passport.authenticate('local'), UsersApi.login(connectionConfig));
  app.post('/api/createAccount', UsersApi.createAccount(db));
  app.get('/api/logout', UsersApi.logout(db));

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