var request = require('request');
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

    var minlon = lng - 0.04491555875;   // 5000m
    var maxlon = lng + 0.04491555875;
    var minlat = lat - 0.04491555875;
    var maxlat = lat + 0.04491555875;


    request({
        url: "http://128.208.1.140:3000/gaia?minlon=" + minlon
                + "&maxlon=" + maxlon + "&minlat=" + minlat + "&maxlat=" + maxlat,
        // url: "http://128.208.1.140:3000/gaia?minlon=-123.3193702&maxlon=-121.3193702&minlat=46.6700333&maxlat=48.6700333",
        // qs: JSON.stringify(propertiesObject)
    }, function(err, dbResult, body) {
        if (err) {
            console.log("Got error: " + err);
        } else {
            // console.log(dbResult);
            var body = JSON.parse(dbResult.body);
            if (body.length) {
                console.log("found data.");
                res.json(body);
            } else {
                console.log("didn't find data. searching.");
                graph.search(searchOptions, get_fb_places);
            }
        }
        });

    console.log("http://128.208.1.140:3000/gaia?minlon=" + minlon
                + "&maxlon=" + maxlon + "&minlat=" + minlat + "&maxlat=" + maxlat);
}

// Request to get Instagram locations (from Facebook places) given certain options.
function get_fb_places(err, fb_res) {
    console.log("performing fb queries, etc");
    if(fb_res.paging && fb_res.paging.next) {
        graph.get(fb_res.paging.next, get_fb_places);
    }

    var fb_places_remaining = fb_res['data'].length;
    for (var j in fb_res['data']) {
        var thisPlace = fb_res['data'][j];

        

        // Search for IG locations based on this FB place.
        ig.location_search({"facebook_places_id": thisPlace.id},
            function(err, locationsResult, remaining, limit) {
                if (err) {
                    console.log("ERROR OCCURED: " + JSON.stringify(err));
                    res.send(err);
                } else {

                    for (var i in locationsResult) {
                        var thisPlace = locationsResult[i];

                        // Set up post request to DB, storing this FB place.
                        var dbPostJson = {
                            "longitude": thisPlace.longitude,
                            "latitude": thisPlace.latitude,
                            "title": thisPlace.name,
                            "description": thisPlace.id,
                            "source": "instagram"
                        };
                        var dbPostString = JSON.stringify(dbPostJson); 

                        request.post({
                            uri: "http://128.208.1.140:3000/gaia",
                            headers: {'content-type': 'application/json'},
                            body: dbPostString
                        }, function(err,res,body){
                            if (err) {
                                console.log(err);
                            } else {
                                // console.log(body);
                                // console.log(res.statusCode);
                            }
                        });


                        var location = {};
                        location.description = thisPlace.id;
                        location.title = thisPlace.name;
                        location.latitude = thisPlace.latitude;
                        location.longitude = thisPlace.longitude;
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















