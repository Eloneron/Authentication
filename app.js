//jshint esversion:6

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
// const encrypt = require('mongoose-encryption');
// const sha512 = require('js-sha512');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect('mongodb://127.0.0.1:27017/userDB', { useNewUrlParser: true });


const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

const secret = process.env.SECRET;


// userSchema.plugin(encrypt, {secret: secret, encryptedFields: ["password"]});
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
        // if (foundUser.password !== sha512(req.body.password)) {
        bcrypt.compare(req.body.password, foundUser.password, function(err, result) {
          if (result !== true) {
            console.log("Incorrect password");
          } else {
            res.render("secrets");
          }
        });
      }
    }
  })
});

app.route("/register")
.get(function(req, res) {
  res.render("register");
})
.post(function(req, res) {
  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    const newUser = new User({
      email: req.body.username,
      // password: sha512(req.body.password)
      password: hash
    });
    newUser.save();
    res.redirect("/");
  })

});


app.listen(3000, function() {
  console.log("Server running on port 3000...");
});
