var express = require("express"),
    app = express(),
    mongoose = require("mongoose");
    bodyParser = require("body-parser");

// mongoose config
mongoose.connect('mongodb://localhost:27017/college_hub', {useNewUrlParser: true, useUnifiedTopology: true});
var collegeSchema = new mongoose.Schema({
    name: String,
    image: String,
    description: String
});

var College = mongoose.model("College", collegeSchema);


// app configuration
app.set("view engine", "ejs");
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended:true}));

// ========
// ROUTING
// ========
app.get("/", function(req, res){
    res.render("landing");
});

// INDEX - to show all the colleges
app.get("/colleges", function(req, res){
    College.find({}, function(err, allCollege){
        if(err){
            console.log(err);
        }else{
            res.render("index", {colleges: allCollege});
        }
    });
});

// NEW - form to add new college
app.get("/colleges/new", function(req, res){
    res.render("new");
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
    College.findById(req.params.id, function(err, foundCollege){
        if(err){
            console.log(err);
        }else{
            res.render("show",{college: foundCollege});
        }
    })
});

app.listen(3000, function(){
    console.log("server started...");
})