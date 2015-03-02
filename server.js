var request = require("request");
var path = require("path");
var express = require("express");
var logger = require("morgan");
var app = express();
var ig = require("instagram-node").instagram();
var graph = require("fbgraph");
var yelp = require("yelp").createClient({
    consumer_key: "Py97HAoHM-vRPRNtyHDPdw",
    consumer_secret: "5Obi26U2Lxp9G-Lntig91RM5g_0",
    token: "Qm9upheoBhFYxPyCgMKEF8wF2zoj5p4G",
    token_secret: "DTO2S3wJuD_8HJw8TNa5mWk4a6o"
});

var dbIP = "128.208.1.140";
var dbPort = "3000";
var serverPort = "3000";

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
app.get("/places/:lat/:lng/:category", getPlaces);
app.get("/media/:location_id", getMedia);

// Route for everything else.
app.get("*", function(req, res){
    res.send("404");
});

// Start server
app.listen(serverPort);
console.log("Listening on port " + serverPort);

// Request to get locations given a latitude and a longitude
function getPlaces(req, res) {
    // Search for media posted in the last 2 days within 5000 meters
    //  of the given location
    var lat = parseFloat(req.params.lat);
    var lng = parseFloat(req.params.lng);
    var category = req.params.category;

    var minlon = lng - 5 * 0.00898311175;   // 5 km
    var maxlon = lng + 5 * 0.00898311175;
    var minlat = lat - 5 * 0.00898311175;
    var maxlat = lat + 5 * 0.00898311175;

    // Query for locations within this range already in the db.
    request({
        url: "http://" + dbIP + ":" + dbPort + "/gaia?minlon=" + minlon
                + "&maxlon=" + maxlon + "&minlat=" + minlat + "&maxlat=" + maxlat,
        // url: "http://128.208.1.140:3000/gaia?minlon=-123.3193702&maxlon=-121.3193702&minlat=46.6700333&maxlat=48.6700333",
    }, function(err, dbResult, body) {
        if (err) {
            console.log("Got error: " + err);
            getPlacesFromServices();
            return;
        } else {
            // console.log(dbResult);
            var body = JSON.parse(dbResult.body);
            if (body.length) {
                console.log("found data.");
                res.json(body);
                return;
            } else {
                console.log("didn't find data. searching.");
                getPlacesFromServices();
            }
        }
    });

    function getPlacesFromServices() {
        var json_out = [];
        var num_services = 1;

        // Request to get Instagram locations (from Facebook places) given certain options.
        var searchOptions = {
            q:     category,
            type:  "place",
            center: lat + "," + lng,
            distance: "5000"
        };
        function getIGPlacesFromFBPlaces(err, fb_res) {
            if(fb_res.paging && fb_res.paging.next) {
                graph.get(fb_res.paging.next, getIGPlacesFromFBPlaces);
            }

            var fb_places_remaining = fb_res['data'].length;
            var ig_json = [];
            for (var j in fb_res['data']) {
                var thisFBPlace = fb_res['data'][j];
                // console.log(thisFBPlace);
                // Search for IG locations based on this FB place.
                ig.location_search({"facebook_places_id": thisFBPlace.id},
                    function(err, locationsResult, remaining, limit) {
                        if (err) {
                            console.log("ERROR OCCURED: " + JSON.stringify(err));
                            res.send(err);
                        } else {
                            for (var i in locationsResult) {
                                var thisIGPlace = locationsResult[i];

                                // This location, to send to the client & db
                                var location = {
                                    // longitude: thisIGPlace.longitude,
                                    // latitude: thisIGPlace.latitude,
                                    coordinates: [thisIGPlace.longitude, thisIGPlace.latitude],
                                    title: thisIGPlace.name,
                                    source_id: thisIGPlace.id,
                                    source: "instagram",
                                    category: category
                                };
                                json_out.push(location);
                            }

                            // If this is now 0, we've finished all the requests.
                            --fb_places_remaining;
                            if (fb_places_remaining <= 0) {
                                // Append ig_json to json_out
                                Array.prototype.push.apply(json_out, ig_json);
                                finishIfAllDone();
                            }
                        }
                    });
            }
        }
        graph.search(searchOptions, getIGPlacesFromFBPlaces);

        
        // Insert code to get locations from other services here, in the same form
        //  (but hopefully simpler because of FB/IG thing) as above. Increment num_services







        function finishIfAllDone() {
            num_services--;
            if (num_services == 0) {
                res.json(json_out);
                // Send the found locations to the db
                request.post({
                    uri: "http://" + dbIP + ":" + dbPort + "/gaia",
                    headers: {'content-type': 'application/json'},
                    body: JSON.stringify(json_out)
                }, function(err,res,body){
                    if (err) {
                        console.log(err);
                    }
                });
            }
        }
    }
}


// Request to get Instagram posts given an Instagram location ID.
function getMedia(req, result) {
    var ig_place_id = req.params.location_id;
    // JSON, "instagram": [ig media], "yelp": [yelp media], etc.
    var json_out = {};
    var num_services = 1;

    json_out.instagram = [];
    ig.location_media_recent(ig_place_id,
        function(err, ig_media_res, pagination, remaining, limit) {
            if (err) {
                result.send(err);
            } else {
                for (var j in ig_media_res) {
                    var post = ig_media_res[j];
                    post.date = (new Date(ig_media_res[j].created_time * 1000)).toString();
                    json_out.instagram.push(post);
                }
                num_services--;
                if (num_services == 0) {
                    result.json(json_out);
                }
            }
        });

    // other services here. make call to find media based on location,
    //  increment num_services, add posts to json_out.servicename


}















