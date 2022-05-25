//jshint esversion:6


require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const saltRounds = 10;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "secretString1",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://127.0.0.1:27017/userDB', {
  useNewUrlParser: true
});


const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function (user, done) {
  done(null, user.id);
});
passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id, email: profile.emails[0].value }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req, res) {
  res.render("home");
});

app.get('/auth/google', passport.authenticate('google', { scope: ['openid', 'profile', 'email'] })
);

app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect('/secrets');
  });

app.route("/login")
  .get(function(req, res) {
    res.render("login");
  })
  .post(passport.authenticate("local", {
    successRedirect: "/secrets",
    failureRedirect: "/login"
  }));

app.route("/register")
  .get(function(req, res) {
    res.render("register");
  })
  .post(function(req, res) {
    User.register({
        username: req.body.username
      },
      req.body.password,
      function(err, user) {
        if (err) {
          console.log(err);
        } else {
          passport.authenticate('local')(req, res, function() {
            res.redirect('/secrets');
          });
        }
      });
  });



app.get('/secrets', function(req, res) {
  // don't cache secrets page, so that going to prev page after logout doesn't show secrets
  res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');

  if (req.isAuthenticated()) {
    res.render('secrets');
  } else {
    res.redirect('login');
  }
});

app.get('/logout', function(req, res) {
  req.logout(function(err) {
    if (err) {
      console.log(err);
    }
    res.redirect('/');
  });
});


app.listen(3000, function() {
  console.log("Server running on port 3000...");
});
