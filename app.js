require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const smmry = require('smmry')({ SM_API_KEY: process.env.API_KEY });

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('public'));

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


let url = "mongodb+srv://" + process.env.USERID +":" + process.env.PASSWORD + "@cluster0-ru1ds.mongodb.net/userDB";

mongoose.connect(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const userSchema = new mongoose.Schema ({
    username: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);
const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req, res) {
    res.render("home");
});

app.get("/register", function(req, res) {
    res.render("register");
});

app.get("/login", function(req, res) {
    res.render("login");
});

app.get("/main", function(req, res) {
    if(req.isAuthenticated()) {
        res.render("main");
    } else {
        res.redirect("/login");
    }
});

app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
});

app.post("/register", function(req, res) {
    User.register({username: req.body.username}, req.body.password, function(err, user) {
        if(err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local") (req, res, function() {
                res.redirect("/main");
            });
        }
    });
});

app.post("/login", function(req, res) {
    const user = new User ({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, function(err) {
        if(err) {
            console.log(err);
            res.redirect("/login");
        } else {
            passport.authenticate("local") (req, res, function() {
                res.redirect("/main");
            });
        }
    });
});

app.post("/main", function(req, res) {
    const text = req.body.inputArticle;
    smmry.summarizeText(text)
      .then(data => {
        res.render('result', {shortText: data.sm_api_content});
        console.log(data);
      })
      .catch(err => {
        console.error(err);
    });
});

app.listen(process.env.PORT || 3000, function() {
    console.log("server active");
});
