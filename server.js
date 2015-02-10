var http = require('http');
var path = require("path");
var express = require("express");
var logger = require("morgan");
var app = express();
var ig = require("instagram-node").instagram();
var graph = require('fbgraph');

// Log the requests
app.use(logger("dev"));

// FB credentials
graph.setAccessToken('1584238351793353|d-YwDPT2Tueuy9zXp1YiCZSSB9k');

// Set up instagram credentials
ig.use({ client_id: '3f4a2693d5cc46a4b0686ae1e8df389a',
     client_secret: '57ed45f5db08440eb435d676208b4c34' });

// Serve static files
app.use(express.static(path.join(__dirname, "public"))); 

// Handle location request
app.get("/ig_places/:lat/:lng", get_ig_places);
app.get("/ig_media/:ig_place_id", get_ig_media);

// Route for everything else.
app.get("*", function(req, res){
    res.send("404");
});

// Start server
app.listen(3000);
console.log("Listening on port 3000");
var json_out = [];
var res;

// Request to get Instagram locations given a latitude and a longitude
function get_ig_places(req, result) {
    // Search for media posted in the last 2 days within 5000 meters
    //  of the given location
    res = result;
    var lat = parseFloat(req.params.lat);
    var lng = parseFloat(req.params.lng);


    var searchOptions = {
        q:     "parks",
        type:  "place",
        center: lat + "," + lng,
        distance: "3000"
    };
    
    graph.search(searchOptions, get_fb_places);
}

// Request to get Instagram locations (from Facebook places) given certain options.
function get_fb_places(err, fb_res) {
    if(fb_res.paging && fb_res.paging.next) {
        graph.get(fb_res.paging.next, get_fb_places);
    }

    var fb_places_remaining = fb_res['data'].length;
    for (var j in fb_res['data']) {

        ig.location_search({"facebook_places_id": fb_res['data'][j].id},
            function(err, locationsResult, remaining, limit) {
                if (err) {
                    console.log("ERROR OCCURED: " + JSON.stringify(err));
                    res.send(err);
                } else {

                    for (var i in locationsResult) {
                        var location = {};
                        location.ig_place_id = locationsResult[i].id;
                        location.name = locationsResult[i].name;
                        location.lat = locationsResult[i].latitude;
                        location.lng = locationsResult[i].longitude;
                        json_out.push(location);
                        
                    }
                    --fb_places_remaining;
                    if (fb_places_remaining <= 0) {
                        res.json(json_out);
                        return;
                    }
                }
            });
     }
}

// Request to get Instagram posts given an Instagram location ID.
function get_ig_media(req, result) {
    var ig_place_id = req.params.ig_place_id;
    // JSON, array of Insta posts
    var json_out = [];

    var options = {
        "min_timestamp": Date.now() - 1000 * 60 * 60 * 24 * 7,
        "max_timestamp": Date.now()
    };
    ig.location_media_recent(ig_place_id, options,
        function(err, ig_media_res, pagination, remaining, limit) {
            if (err) {
                result.send(err);
            } else {
                for (var j in ig_media_res) {
                    var post = ig_media_res[j];
                    post.date = (new Date(ig_media_res[j].created_time * 1000)).toString();
                    json_out.push(post);
                }
                result.json(json_out);
            }
        });

}















