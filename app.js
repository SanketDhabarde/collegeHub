var express = require("express"),
    app = express(),
    mongoose = require("mongoose"),
    methodOverride = require("method-override"),
    College = require("./models/college"),
    Comment = require("./models/comment"),
    User = require("./models/user"),
    passport = require("passport");
    localStrategy = require("passport-local"),
    bodyParser = require("body-parser");

// mongoose config
mongoose.connect('mongodb://localhost:27017/college_hub', {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify:false});

// app configuration
app.set("view engine", "ejs");
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride("_method"));

//passport config
app.use(require("express-session")({
    secret: "sanket is best!",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser()); 

// middleware of currentUser for all routes
app.use(function(req, res, next){
    // res.locals is for all the routes
    res.locals.currentUser = req.user;
    next();
});

// ROUTING
app.get("/", function(req, res){
    res.render("landing");
});

// =============
// COLLEGE ROUTES
// =============

// INDEX - to show all the colleges
app.get("/colleges", function(req, res){
    College.find({}, function(err, allCollege){
        if(err){
            console.log(err);
        }else{
            res.render("college/index", {colleges: allCollege});
        }
    });
});

// NEW - form to add new college
app.get("/colleges/new", isLoggedIn, function(req, res){
    res.render("college/new");
});

// CREATE - create a new college
app.post("/colleges", isLoggedIn, function(req, res){
    // create a new college abd save in db
    College.create(req.body.college, function(err, college){
        if(err){
            console.log(err);
        }else{
            // add username and id to college
            college.author.username = req.user.username;
            college.author.id = req.user._id;
            // save the college
            college.save();
            // show the college on index page
            res.redirect("/colleges");
        }
    });
});

// SHOW - to show more info about particular college
app.get("/colleges/:id", function(req, res){
    // first find the college in db
    College.findById(req.params.id).populate("comments").exec(function(err, foundCollege){
        if(err){
            console.log(err);
        }else{
            res.render("college/show",{college: foundCollege});
        }
    })
});

// EDIT - to show edit form the info of college
app.get("/colleges/:id/edit", checkCollegeOwnership, function(req, res){
    // found the college you want to edit
    College.findById(req.params.id, function(err, foundCollege){
        if(err){
            console.log(err);
        }else{
            res.render("college/edit", {college: foundCollege});
        }
    })
});

// UPDATE - to update the info
app.put("/colleges/:id", checkCollegeOwnership, function(req, res){
    // find the college and update info
    College.findByIdAndUpdate(req.params.id, req.body.college, function(err, updatedCollege){
        if(err){
            console.log(err);
        }else{
            res.redirect("/colleges/"+ req.params.id);
        }
    });
});

// DELETE - to delete the college
app.delete("/colleges/:id", checkCollegeOwnership, function(req, res){
    // find the college and delete it
    College.findByIdAndRemove(req.params.id, function(err){
        if(err){
            console.log(err);
        }else{
            res.redirect("/colleges");
        }
    })
});

// ===============
// comments routes
// ===============

//NEW - to show the form to add comments
app.get("/colleges/:id/comments/new", isLoggedIn, function(req, res){
    // find the college for which you want to add comments
    College.findById(req.params.id, function(err, foundCollege){
        if(err){
            console.log(err);
        }else{
            // render the form
            res.render("comments/new", {college: foundCollege});
        }
    });
});

// CREATE - to create the comment
app.post("/colleges/:id/comments", isLoggedIn, function(req, res){
    // find the college for which you want to add comments
    College.findById(req.params.id, function(err, college){
        if(err){
            console.log(err);
        }else{
            // create the comment
            Comment.create(req.body.comment, function(err, comment){
                if(err){
                    console.log(err);
                }else{
                    // add id and username to comment
                    comment.author.id= req.user._id;
                    comment.author.username=req.user.username;
                    // save the comment
                    comment.save();
                    // add this comment to College db
                    college.comments.push(comment);
                    college.save();
                    res.redirect("/colleges/"+req.params.id);
                }
            });
        }
    });
});

// EDIT - edit the comments
app.get("/colleges/:id/comments/:comment_id/edit", checkCommentOwnership, function(req, res){
    // found the comment you want to edit
    var college_id=req.params.id;
    Comment.findById(req.params.comment_id, function(err, foundComment){
        if(err){
            console.log(err);
        }else{
            res.render("comments/edit",{comment:foundComment, college_id});
        }
    })
});

// UPDATE - UPADATED COMMENT
app.put("/colleges/:id/comments/:comment_id", checkCommentOwnership, function(req, res){
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
        if(err){
            console.log(err);
        }else{
            res.redirect("/colleges/"+req.params.id);
        }
    });
});

// DELETE - to delte the comment
app.delete("/colleges/:id/comments/:comment_id", checkCommentOwnership, function(req, res){
    Comment.findByIdAndRemove(req.params.comment_id, function(err){
        if(err){
            res.redirect("/colleges/"+req.params.id);
        }else{
            res.redirect("/colleges/"+req.params.id);
        }
    })
});

// ===========
// AUTH ROUTES
// ===========

// form to register the user
app.get("/register", function(req, res){
    res.render("register");
});

// handle the sign up logic
app.post("/register", function(req, res){
    var newUser = new User({username: req.body.username});
    // register the user
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.redirect("/register");
        }
        passport.authenticate("local")(req, res, function(){
            res.redirect("/colleges");
        });
    });
});

// to show login form
app.get("/login", function(req, res){
    res.render("login");
});

// handle login logic
app.post("/login", passport.authenticate("local", {
    successRedirect: "/colleges",
    failureRedirect: "/login"
}), function(req, res){
});

// logout 
app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/colleges");
});

// middleware for user auth
function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}

//college Authorization
function checkCollegeOwnership(req, res, next){
    // check if there is user
    if(req.isAuthenticated()){
        // find the college from db
        College.findById(req.params.id, function(err, foundCollege){
            if(err){
                res.redirect("back");
            }else{
                // check if user has submitted the college
                if(foundCollege.author.id.equals(req.user._id)){
                    next();
                }else{
                    res.redirect("back");
                }
            }
        })
    }else{
        res.redirect("/login");
    }
}

// comment authorization
function checkCommentOwnership(req, res, next){
    // check if user login
    if(req.isAuthenticated()){
        // find the comment
        Comment.findById(req.params.comment_id, function(err, foundComment){
            if(err){
                res.redirect("back");
            }else{
                // found if same user created comment
                if(foundComment.author.id.equals(req.user._id)){
                    next();
                }else{
                    res.redirect("back");
                }
            }
        })
    }else{
        res.redirect("/login");
    }
}


app.listen(3000, function(){
    console.log("server started...");
})