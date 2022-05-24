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
  password: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req, res) {
  res.render("home");
});

app.route("/login")
  .get(function(req, res) {
    res.render("login");
  })
  .post(passport.authenticate("local",{

  successRedirect: "/secrets",

  failureRedirect: "/login"

}));

// below code is old and vulnerable - DON'T USE:
  // .post(function(req, res) {
  //   const user = new User({
  //     username: req.body.username,
  //     password: req.body.password
  //   });
  //   req.login(user, function(err) {
  //     if (err) {
  //       console.log(err);
  //     } else {
  //       passport.authenticate('local')(req, res, function() {
  //         res.redirect('/secrets');
  //       });
  //     }
  //   });
  //
  //
  // });

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
    if (err) {  console.log(err); }
    res.redirect('/');
  });
});


app.listen(3000, function() {
  console.log("Server running on port 3000...");
});
