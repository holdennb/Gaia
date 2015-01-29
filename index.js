
var path = require("path");
var express = require("express");
var logger = require("morgan");
var app = express();
var ig = require("instagram-node").instagram();

// Log the requests
app.use(logger("dev"));

// Set up instagram credentials
ig.use({ client_id: '3f4a2693d5cc46a4b0686ae1e8df389a',
     client_secret: '57ed45f5db08440eb435d676208b4c34' });

// Serve static files
app.use(express.static(path.join(__dirname, "public"))); 

// Handle location request
app.get("/instagram/:lat/:lng", getInstaResponse);

// Route for everything else.
app.get("*", function(req, res){
  res.send("404");
});

// Start server
app.listen(3000);
console.log("Listening on port 3000");

function getInstaResponse(req, res) {
    // Search for media posted in the last 2 days within 5000 meters
    //  of the given location
    var lat = parseFloat(req.params.lat);
    var lng = parseFloat(req.params.lng);

    ig.location_search({"lat": lat, "lng": lng}, [3000],
        function(err, locationsResult, remaining, limit) {
            if (err) {
                res.send(err);
            } else {
                var jsonOut = [];
                var reqsRemaining = locationsResult.length;
                for (var i in locationsResult) {
                    var location = {};
                    var id = locationsResult[i].id;
                    location.id = id;
                    location.name = locationsResult[i].name;
                    location.posts = [];

                    (function (thisId, thisLocation) {
                        ig.location_media_recent(thisId,
                        function(err, mediaResult, pagination, remaining, limit) {
                            if (err) {
                                res.send(err);
                            } else {
                                for (var j in mediaResult) {
                                    var thisPost = {};
                                    thisPost.link = mediaResult[j].link;
                                    thisLocation.posts.push(thisPost);
                                }
                                // inner done
                                jsonOut.push(thisLocation);
                                --reqsRemaining;
                                if (reqsRemaining <= 0) {
                                    res.json(jsonOut);
                                }
                            }
                        });
                    })(id, location);
                    
                }
                // done
            }
        });
}




















