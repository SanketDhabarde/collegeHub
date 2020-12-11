var express = require("express"),
    app = express(),
    mongoose = require("mongoose"),
    methodOverride = require("method-override"),
    bodyParser = require("body-parser");

// mongoose config
mongoose.connect('mongodb://localhost:27017/college_hub', {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify:false});
// college model
var collegeSchema = new mongoose.Schema({
    name: String,
    image: String,
    description: String,
    comments:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Comment"
        }
    ]
});

var College = mongoose.model("College", collegeSchema);

// comment model
var commentSchema = new mongoose.Schema({
    author: String,
    text : String
});

var Comment = mongoose.model("Comment", commentSchema);

// app configuration
app.set("view engine", "ejs");
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride("_method"));

// ROUTING
app.get("/", function(req, res){
    res.render("landing");
});

// ===========
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
app.get("/colleges/new", function(req, res){
    res.render("college/new");
});

// CREATE - create a new college
app.post("/colleges", function(req, res){
    // create a new college abd save in db
    College.create(req.body.college, function(err, college){
        if(err){
            console.log(err);
        }else{
            // show the college on colleges page
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
app.get("/colleges/:id/edit", function(req, res){
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
app.put("/colleges/:id", function(req, res){
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
app.delete("/colleges/:id", function(req, res){
    // find the college and delete it
    College.findByIdAndRemove(req.params.id, function(err){
        if(err){
            console.log(err);
        }else{
            res.redirect("/colleges");
        }
    })
});

// ========
// comments routes
// =========

//NEW - to show the form to add comments
app.get("/colleges/:id/comments/new", function(req, res){
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
app.post("/colleges/:id/comments", function(req, res){
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
app.get("/colleges/:id/comments/:comment_id/edit", function(req, res){
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
app.put("/colleges/:id/comments/:comment_id", function(req, res){
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
        if(err){
            console.log(err);
        }else{
            res.redirect("/colleges/"+req.params.id);
        }
    });
});

// DELETE - to delte the comment
app.delete("/colleges/:id/comments/:comment_id", function(req, res){
    Comment.findByIdAndRemove(req.params.comment_id, function(err){
        if(err){
            res.redirect("/colleges/"+req.params.id);
        }else{
            res.redirect("/colleges/"+req.params.id);
        }
    })
});

app.listen(3000, function(){
    console.log("server started...");
})