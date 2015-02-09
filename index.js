var http = require('http');
var path = require("path");
var express = require("express");
var logger = require("morgan");
var app = express();
var ig = require("instagram-node").instagram();
var graph = require('fbgraph');

graph.setAccessToken('1584238351793353|d-YwDPT2Tueuy9zXp1YiCZSSB9k');

// var searchOptions = {
//     q:     "coffee",
//     type:  "place",
//     center: "47.6668621,-122.3163902",
//     distance: "3000"
// };
 
// graph.search(searchOptions, function(err, res) {
//     for (var j in res['data']) {
//         console.log(res['data'][j].location); // {data: [{id: xxx, from: ...}, {id: xxx, from: ...}]} 
//     }
//     // console.log(res['data'].length);
// });




// Log the requests
app.use(logger("dev"));

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
    console.log("-------- 404 OCCURED");
    res.send("404");
});

// Start server
app.listen(3000);
console.log("Listening on port 3000");
var json_out = [];
var res;
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

function get_fb_places(err, fb_res) {
    console.log("get_fb_places called");
    if(fb_res.paging && fb_res.paging.next) {
        graph.get(fb_res.paging.next, get_fb_places);
    }

    var fb_places_remaining = fb_res['data'].length;
    // console.log(fb_res);
    for (var j in fb_res['data']) {

        ig.location_search({"facebook_places_id": fb_res['data'][j].id},
            function(err, locationsResult, remaining, limit) {
                if (err) {
                    console.log("-------- ERROR OCCURED: " + JSON.stringify(err));
                    res.send(err);
                } else {

                    for (var i in locationsResult) {
                        var location = {};
                        location.ig_place_id = locationsResult[i].id;
                        console.log(location.ig_place_id);
                        location.name = locationsResult[i].name;
                        location.lat = locationsResult[i].latitude;
                        location.lng = locationsResult[i].longitude;
                        json_out.push(location);
                        
                    }
                    --fb_places_remaining;
                    if (fb_places_remaining <= 0) {
                        console.log("-------- ABOUT TO SEND. YES RESULTS");
                        res.json(json_out);
                        return;
                    }
                    // done

                }
            });
        }

    }


function get_ig_media(req, result) {
    var ig_place_id = req.params.ig_place_id;
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















