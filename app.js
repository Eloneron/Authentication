//jshint esversion:6

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect('mongodb://127.0.0.1:27017/userDB', { useNewUrlParser: true });


const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

// don't !!!
const secret = process.env.SECRET;


userSchema.plugin(encrypt, {secret: secret, encryptedFields: ["password"]});
const User = new mongoose.model("User", userSchema);

app.get("/", function(req, res) {
  res.render("home");
});

app.route("/login")
.get(function(req, res) {
  res.render("login");
})
.post(function(req, res) {
  User.findOne({email: req.body.username}, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (!foundUser) {
        console.log("No such user");
      } else {
        if (foundUser.password !== req.body.password) {
          console.log("Incorrect password");
        } else {
          res.render("secrets");
        }
      }
    }
  })
});

app.route("/register")
.get(function(req, res) {
  res.render("register");
})
.post(function(req, res) {
  const newUser = new User({
    email: req.body.username,
    password: req.body.password
  });
  newUser.save();
  res.redirect("/");
});


app.listen(3000, function() {
  console.log("Server running on port 3000...");
});