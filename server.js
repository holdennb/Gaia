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
var GooglePlaces = require("googleplaces");
var googlePlaces = new GooglePlaces("AIzaSyDmXeo1F1VjrRLQRVy1iB55lcjfi1keU-g", "json");

// var dbIP = "128.208.1.140";
var dbIP = "gaiadb-holdennb.rhcloud.com";
// var dbPort = ":3000";
var dbPort = "";
var serverPort = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var serverIP = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";

// Log the requests
app.use(logger("dev"));
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

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
app.listen(serverPort, serverIP, function() {
    console.log("Listening on port " + serverPort);
});

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
    var minlat = lat - 5 * 0.00898311175;   // .00004 = about 5 m
    var maxlat = lat + 5 * 0.00898311175;

    // Query for locations within this range already in the db.
    request({
        url: "http://" + dbIP + dbPort + "/gaiadb/filter/box?minlon=" + minlon
                + "&maxlon=" + maxlon + "&minlat=" + minlat + "&maxlat=" + maxlat
                + "&category=" + category,
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
        // console.log("NEW REQUEST -------");
        var json_out = [];
        var num_services = 3;

        // Request to get Instagram locations (from Facebook places) given certain options.
        var searchOptions = {
            q:     category,
            type:  "place",
            center: lat + "," + lng,
            distance: "5000"
        };
        console.log("searching with " + lat + ", " + lng);
        function getIGPlacesFromFBPlaces(err, fb_res) {
            if (err) {
                console.log("getIGfromFB err");
                console.log(err);
                num_services = finishIfAllDoneLoc(num_services, res, []);
                console.log("num is " + num_services + " in getIFfromFB err");
                return;
            }
            // console.log(fb_res);

            if(fb_res && fb_res.paging && fb_res.paging.next) {
                num_services++;
                graph.get(fb_res.paging.next, getIGPlacesFromFBPlaces);
            }
            // console.log(err);
            // console.log(fb_res['data']);
            if (fb_res && fb_res['data'] && fb_res['data'].length) {
                var fb_places_remaining = fb_res['data'].length;
                var ig_json = [];
                if (!fb_res['data'].length && !fb_res['paging']) {
                    // console.log(fb_res);
                    num_services = finishIfAllDoneLoc(num_services, res, []);
                    console.log("num is " + num_services + " in getIGfromFB empty no paging");
                    return;
                } else {
                    for (var j in fb_res['data']) {
                        // console.log("in fbdata loop");
                        var thisFBPlace = fb_res['data'][j];
                        // console.log(thisFBPlace);
                        // Search for IG locations based on this FB place.
                        ig.location_search({"facebook_places_id": thisFBPlace.id},
                            function(err, locationsResult, remaining, limit) {
                                if (err) {
                                    console.log("igLocSearch err");
                                    console.log(err);
                                    res.send(err);
                                } else {
                                    if (locationsResult.length > 0) {
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
                                    }

                                    // If this is now 0, we've finished all the requests.
                                    --fb_places_remaining;
                                    if (fb_places_remaining <= 0) {
                                        // console.log(num_services);
                                        // Append ig_json to json_out
                                        Array.prototype.push.apply(json_out, ig_json);
                                        num_services = finishIfAllDoneLoc(num_services, res, json_out);
                                        console.log("num is " + num_services + " in igLocSearch");
                                        return;
                                    }
                                }
                            });
                    }
                }
            } else {
                num_services = finishIfAllDoneLoc(num_services, res, json_out);
                console.log("num is " + num_services + " in getIGfromFB empty");
                return;
            }
        }
        graph.search(searchOptions, getIGPlacesFromFBPlaces);
        
        // Insert code to get locations from other services here, in the same form
        //  (but hopefully simpler because of FB/IG thing) as above. Increment num_services

        function getYelpPlaces(error, data) {
            if (error) {
                console.log("yelp error");
                console.log(error);
                num_services = finishIfAllDoneLoc(num_services, res, []);
                console.log("num is " + num_services + " in getYelpPlaces err");
                return;
            }
            // console.log(data);

            var yelp_remaining = data.businesses.length;
            if (yelp_remaining > 0) {
                for (var i in data.businesses) {
                    var thisPlace = data.businesses[i];

                    // console.log(thisPlace);
                    if (thisPlace.location.coordinate) {
                        var location = {
                            // coordinates: [body.results[0].geometry.location.lng,
                            //     body.results[0].geometry.location.lat],
                            longitude: thisPlace.location.coordinate.longitude,
                            latitude: thisPlace.location.coordinate.latitude,
                            title: thisPlace.name,
                            location_id: thisPlace.id,
                            source: "yelp",
                            category: category,

                        };
                        // console.log(location);
                        json_out.push(location);
                    }
                    // If this is now 0, we've finished all the requests.
                    --yelp_remaining;
                    if (yelp_remaining <= 0) {
                        num_services = finishIfAllDoneLoc(num_services, res, json_out);
                        console.log("num is " + num_services + " in getYelp business");
                        return;
                    }
                    // });       
                }
            } else {
                num_services = finishIfAllDoneLoc(num_services, res, json_out);
                console.log("num is " + num_services + " in getYelp empty");
                return;
            }
        }
        yelp.search({term: category, ll: lat + "," + lng}, getYelpPlaces);


        var googleParams = {
            location: [lat, lng],
            radius: 5000,
            keyword: category
        };
        function getGooglePlaces(error, response) {
            if (error) {
                console.log("google error");
                console.log(error);
                num_services = finishIfAllDoneLoc(num_services, res, []);
                console.log("num is " + num_services + " in getGoogle err");
                return;
            }
            // console.log(response);

            var google_remaining = response.results.length;

            if (google_remaining > 0) {
                for (var i in response.results) {
                    var thisPlace = response.results[i];
                    // console.log(thisPlace.location);

                    if (thisPlace.geometry && thisPlace.geometry.location) {
                        var location = {
                            // coordinates: [body.results[0].geometry.location.lng,
                            //     body.results[0].geometry.location.lat],
                            longitude: thisPlace.geometry.location.lng,
                            latitude: thisPlace.geometry.location.lat,
                            title: thisPlace.name,
                            location_id: thisPlace.reference,
                            source: "google",
                            category: category,

                        };
                        // console.log(location);
                        json_out.push(location);
                    }
                    // If this is now 0, we've finished all the requests.
                    --google_remaining;
                    if (google_remaining <= 0) {
                        num_services = finishIfAllDoneLoc(num_services, res, json_out);
                        console.log("num is " + num_services + " in getGoogle response");
                        return;
                    }
       
                }
            } else {
                num_services = finishIfAllDoneLoc(num_services, res, json_out);
                console.log("num is " + num_services + " in getGoogle empty");
                return;
            }
        }
        googlePlaces.placeSearch(googleParams, getGooglePlaces);


        
    }
}

// Takes in # of services, response object, and json_out
function finishIfAllDoneLoc(num_services, res, json_out) {
    num_services--;
    // console.log(num_services);
    if (num_services == 0) {
        // res.json(json_out);

        // console.log("posting data: " + JSON.stringify(json_out));

        // Send the found locations to the db
        request.post({
            uri: "http://" + dbIP + dbPort + "/gaiadb",
            headers: {'content-type': 'application/json'},
            body: JSON.stringify(json_out)
        }, function(err, result, body){
            console.log("db result from http://" + dbIP + dbPort + "/gaiadb:");
            console.log(result);
            console.log("db body:");
            console.log(body);

            if (err) {
                console.log("db result error:");
                console.log(err);
            } else {
                var body_json = JSON.parse(body);
                if (!body_json.error) {
                    // console.log("sending body_json");
                    res.json(body_json);
                } else {
                    // console.log("sending empty");
                    res.json([]);
                }
            }
        });
    }
    return num_services;
}

// Takes in # of services, response object, client_out, and  
function finishIfAllDoneMed(num_services, res, client_out, gaia_id) {
    num_services--;
    if (num_services == 0) {
        // console.log(client_out);
        res.json(client_out);

        // Send the found media to the db
        for (var source in client_out) {
            if (client_out.hasOwnProperty(source)) {
                request.put({
                    uri: "http://" + dbIP + dbPort + "/gaiadb/addMedia"
                        + "?id=" + gaia_id + "&source=" + source,
                    headers: {'content-type': 'application/json'},
                    body: JSON.stringify(client_out[source])
                }, function(err, result, body){
                    // console.log(body);

                    if (err) {
                        console.log("medDBResult err");
                        console.log(err);
                    } else {
                        // console.log(body);
                    }
                });
            }
        }
    }
    return num_services;
}


// Request to get Instagram posts given an Instagram location ID.
function getMedia(req, result) {
    // JSON, "instagram": [ig media], "yelp": [yelp media], etc.
    var json_out = {};
    var num_services = 3;
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
                        if (thisRes.location) {
                            // console.log(thisRes);
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
                    }
                    num_services = finishIfAllDoneMed(num_services, result, json_out, gaia_id);
                    return;
                }
            });
    } else {
        num_services = finishIfAllDoneMed(num_services, result, json_out, gaia_id);
    }

    // other services here. make call to find media based on location,
    //  increment num_services, add posts to json_out.servicename


    if (req.query.yelp && req.query.yelp.length) {
        var yelp_id = req.query.yelp[0].location_id;
        json_out.yelp = [];
        yelp.business(yelp_id,
            function(err, data) {
                if (err) {
                    result.send(err);
                } else {
                    // for (var j in ig_media_res) {
                        // var thisRes = ig_media_res[j];

                        // var post = {
                        //     location_id: thisRes.location.id,
                        //     post_id: thisRes.id,
                        //     text: (thisRes.caption ? thisRes.caption.text : ""),
                        //     image_url: thisRes.images.standard_resolution.url,
                        //     link: thisRes.link,
                        //     rating: thisRes.likes.count,
                        //     date: (new Date(thisRes.created_time * 1000)).toString()
                        // };
                        
                    json_out.yelp.push(data);
                    // }
                    num_services = finishIfAllDoneMed(num_services, result, json_out, gaia_id);
                    return;
                }
            });
    } else {
        num_services = finishIfAllDoneMed(num_services, result, json_out, gaia_id);
    }

    if (req.query.google && req.query.google.length) {
        var google_id = req.query.google[0].location_id;
        json_out.google = [];
        googlePlaces.placeDetailsRequest({reference: google_id},
            function(error, response) {
                if (error) {
                    result.send(error);
                } else {
                    // console.log(response);
                    if (response.result) {
                        var post = response.result;
                        json_out.google.push(post);
                    }
                    num_services = finishIfAllDoneMed(num_services, result, json_out, gaia_id);
                    return;
                }
            });
    } else {
        num_services = finishIfAllDoneMed(num_services, result, json_out, gaia_id);
    }

}















