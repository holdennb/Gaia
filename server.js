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
app.get("/media/:gaia_id", getMedia);

// Route for everything else.
app.get("*", function(req, res){
    res.send("404");
});

// Start server
app.listen(serverPort);
console.log("Listening on port " + serverPort);

// Request to get locations given a latitude and a longitude
function getPlaces(req, res) {
    // console.log(req.url);



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
        url: "http://" + dbIP + ":" + dbPort + "/gaiadb/filter/box?minlon=" + minlon
                + "&maxlon=" + maxlon + "&minlat=" + minlat + "&maxlat=" + maxlat
                + "&category=" + category,
    }, function(err, dbResult, body) {
        if (err) {
            console.log("Got error: " + err);
            getPlacesFromServices();
            return;
        } else {
            console.log(dbResult);
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
        // console.log("NEW REQUEST -------");
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
            if(fb_res && fb_res.paging && fb_res.paging.next) {
                graph.get(fb_res.paging.next, getIGPlacesFromFBPlaces);
            }

            var fb_places_remaining = fb_res['data'].length;
            var ig_json = [];
            if (!fb_res['data'].length && !fb_res['paging']) {
                // console.log(fb_res);
                finishIfAllDoneLoc(num_services, res, []);
            } else {
                for (var j in fb_res['data']) {
                    // console.log("in fbdata loop");
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
                                        longitude: thisIGPlace.longitude,
                                        latitude: thisIGPlace.latitude,
                                        // coordinates: [thisIGPlace.longitude, thisIGPlace.latitude],
                                        title: thisIGPlace.name,
                                        location_id: thisIGPlace.id,
                                        source: "instagram",
                                        category: category
                                    };
                                    ig_json.push(location);
                                }

                                // If this is now 0, we've finished all the requests.
                                --fb_places_remaining;
                                if (fb_places_remaining <= 0) {
                                    // console.log(num_services);
                                    // Append ig_json to json_out
                                    Array.prototype.push.apply(json_out, ig_json);
                                    finishIfAllDoneLoc(num_services, res, json_out);
                                }
                            }
                        });
                }
            }
        }
        graph.search(searchOptions, getIGPlacesFromFBPlaces);

        
        // Insert code to get locations from other services here, in the same form
        //  (but hopefully simpler because of FB/IG thing) as above. Increment num_services
/*
        yelp.search({term: category, ll: lat + "," + lng}, function(error, data) {
            if (error) {
                console.log(error);
                return;
            }
            var yelp_remaining = data.businesses.length;

            for (var i in data.businesses) {
                var thisPlace = data.businesses[i];

                var address = thisPlace.location.address[0] + " "
                     + thisPlace.location.city + " " + thisPlace.location.country_code;

                // yelp doesn't give lat & lng, so have to query for it...ugh
                // console.log(address);
                request({
                    url: "http://maps.googleapis.com/maps/api/geocode/json?address="
                    + address,
                }, function(err, data, body) {
                    console.log(body);
                    if (err) {
                        console.log(err);
                    } else if (body.results && body.results.length) {
                        console.log(body.results[0].geometry.location.lat + "," + body.results[0].geometry.location.lng);
                        // This location, to send to the client & db
                        var location = {
                            coordinates: [body.results[0].geometry.location.lng,
                                body.results[0].geometry.location.lat],
                            title: thisPlace.name,
                            location_id: thisPlace.id,
                            source: "yelp",
                            // category: category
                        };
                        json_out.push(location);
                    }
                    // If this is now 0, we've finished all the requests.
                    --yelp_remaining;
                    if (yelp_remaining <= 0) {
                        // Append ig_json to json_out
                        finishIfAllDoneLoc(num_services, res, json_out);
                    }
                });       

            }
        });
*/




        
    }
}

// Takes in # of services, response object, and json_out
function finishIfAllDoneLoc(num_services, res, json_out) {
    num_services--;
    if (num_services == 0) {
        // res.json(json_out);

        // console.log("posting data: " + JSON.stringify(db_out));

        // Send the found locations to the db
        request.post({
            uri: "http://" + dbIP + ":" + dbPort + "/gaiadb",
            headers: {'content-type': 'application/json'},
            body: JSON.stringify(db_out)
        }, function(err, result, body){
            // console.log(body);
            var body_json = JSON.parse(body);
            // console.log("body.length: " + body_json.length);
            // console.log("db_out.length: " + db_out.length);
            // console.log("json_out.length: " + json_out.length);
            if (err) {
                console.log(err);
            } else if (!body_json.error) {
                // console.log("sending body_json");
                res.json(body_json);
            } else {
                // console.log("sending empty");
                res.json([]);
            }
        });
    }
}

// Takes in # of services, response object, client_out, and db_out 
function finishIfAllDoneMed(num_services, res, client_out, db_out, gaia_id) {
    num_services--;
    if (num_services == 0) {
        res.json(client_out);

        // Send the found media to the db
        for (var source in client_out) {
            if (client_out.hasOwnProperty(source)) {
                request.put({
                    uri: "http://" + dbIP + ":" + dbPort + "/gaiadb/addMedia"
                        + "?id=" + gaia_id + "&source=" + source,
                    headers: {'content-type': 'application/json'},
                    body: JSON.stringify(client_out[source])
                }, function(err, result, body){
                    // console.log(body);
                    // var body_json = JSON.parse(body);
                    // console.log("body.length: " + body_json.length);
                    // console.log("db_out.length: " + db_out.length);
                    // console.log("client_out.length: " + client_out.length);
                    if (err) {
                        console.log(err);
                    } else {
                        // console.log(body);
                    }
                    //else if (!body_json.error) {
                    //     console.log("sending body_json");
                    //     res.json(body_json);
                    // } else {
                    //     console.log("sending empty");
                    //     res.json([]);
                    // }
                });
            }
        }
    }
}


// Request to get Instagram posts given an Instagram location ID.
function getMedia(req, result) {
    // JSON, "instagram": [ig media], "yelp": [yelp media], etc.
    var json_out = {};
    var db_out = [];
    var num_services = 1;
    var gaia_id = req.params.gaia_id;
    console.log("getting media from services");

    // here i need: service ids, gaia id. (so just whole location object?)

    if (req.query.instagram && req.query.instagram.length) {
        var ig_place_id = req.query.instagram[0].location_id;
        json_out.instagram = [];
        ig.location_media_recent(ig_place_id,
            function(err, ig_media_res, pagination, remaining, limit) {
                if (err) {
                    result.send(err);
                } else {
                    for (var j in ig_media_res) {
                        var thisRes = ig_media_res[j];

                        var post = {
                            location_id: thisRes.location.id,
                            post_id: thisRes.id,
                            text: (thisRes.caption ? thisRes.caption.text : ""),
                            image_url: thisRes.images.standard_resolution.url,
                            link: thisRes.link,
                            rating: thisRes.likes.count,
                            date: (new Date(thisRes.created_time * 1000)).toString()
                        };
                        
                        json_out.instagram.push(post);
                    }
                    finishIfAllDoneMed(num_services, result, json_out, db_out, gaia_id);
                }
            });
    } else {
        finishIfAllDoneMed(num_services, result, json_out, db_out, gaia_id);
    }

    // other services here. make call to find media based on location,
    //  increment num_services, add posts to json_out.servicename


}















