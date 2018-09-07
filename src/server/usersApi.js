var login = (req, res) => {
    res.send(ApiResponse(true, null))
  }

  var createAccount = (req, res) => {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(req.body.password, salt)

    db.collection('users').find({ user: req.body.username }).toArray((geterr, items) => {
      if (items.length > 0) {
        res.send(ApiResponse(false, false));
        return;
      }
      db.collection('users').save({ user: req.body.username, passwordHash: hash, household: req.body.household });
      res.send(ApiResponse(false, true));
    });

  }

  var logout = (req, res, next) => {
    req.logout();
    req.session.destroy(function (logerr) {
      if (!logerr) {
        res.clearCookie('connect.sid').send();
      } else {
        res.send();
      }

    });
  }

module.exports.login = login;
module.exports.logout = logout;
module.exports.createAccount = createAccount;