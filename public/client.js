(function() {

var map = false;
var infowindow = false;
var markers = [];
var serverIP = "128.208.1.139";
var serverPort = "4000";
var defaultIcon;

$(document).ready(function() {
    var lat = 47.6097;
    var lng = -122.3331;
    var locationString = "Current Location";
    var category = encodeURIComponent($("#category").val());

    loadWithCurrentLocation(lat, lng, category);

    // Search form
    $("#search-form").submit(function(event) {
        event.preventDefault();
        category = encodeURIComponent($("#category").val());
        var address = $("#address").val();
        console.log(category);
        console.log(address);
        console.log(lat);
        console.log(lng);

        if (address.toLowerCase() != locationString) {
            locationString = address.toLowerCase();
            if (locationString == "current location") {
                console.log("it's current location!");
                loadWithCurrentLocation(lat, lng, category);
            } else {
                console.log("new other location");
                $.getJSON("http://maps.googleapis.com/maps/api/geocode/json?address="
                    + encodeURIComponent(address),
                    function(data) {
                        $("#error p").text("");
                        if (data.results.length == 1) {
                            // If just one address result, use it
                            processRequest(data.results[0].geometry.location.lat,
                                data.results[0].geometry.location.lng, category);
                        } else if (data.results.length > 1) {
                            // Show top 4 address results, make them clickable
                            $("#top-four").html("");
                            for (var i = 0; i < Math.min(4, data.results.length); i++) {
                                var result = data.results[i];
                                var item = $("<li></li>");

                                item.attr("data-lat", result.geometry.location.lat);
                                item.attr("data-lng", result.geometry.location.lng);
                                item.text(result.formatted_address);
                                item.click(function() {
                                    $("#results").slideToggle();
                                    $("#address").val($(this).text());
                                    locationString = $(this).text().toLowerCase();
                                    lat = encodeURIComponent($(this).attr("data-lat"));
                                    lng = encodeURIComponent($(this).attr("data-lng"));
                                    processRequest(lat, lng, category);
                                });
                                $("#top-four").append(item);
                            }
                            $("#results").slideToggle();
                        } else {
                            // Address not found
                            $("#error p").text("Address not found.");
                        }
                    });
            }
        } else {
            processRequest(lat, lng, category);
        }
    });

    $("#info #close").click(function() {
        closeInfoWindow();
    });
});

function loadWithCurrentLocation(lat, lng, category) {
    if (navigator.geolocation) {
        console.log("nav.geo");
        navigator.geolocation.getCurrentPosition(function(position) {
            // Got current location!
            console.log("getCurPos callback");
            lat = position.coords.latitude;
            lng = position.coords.longitude;
            processRequest(lat,lng, category)    
        }, function() {
            processRequest(lat, lng, category);
        });
    } else {
        console.log("not nav.geo");
        // Can't get current location :/
        $("#error p").text("Geolocation is not supported by this browser. Please use address.");

        processRequest(lat, lng, category);
    }
}

// Reload map with current query
function processRequest(lat, lng, category) {
    console.log(lat);
    console.log(lng);
    $("h1#gaia").removeClass("loaded");
    console.log("procReq");

    if (!map && !infowindow) {
        // Set up google map
        var current_loc = new google.maps.LatLng(lat, lng);
        var mapOptions = {
            zoom: 13,
            center: current_loc
        }
        map = new google.maps.Map(document.getElementById('map'), mapOptions);
        infowindow = new google.maps.InfoWindow();
    }

    // Query server to get JSON for locations
    $.getJSON("http://"  + serverIP + ":" + serverPort
            + "/places/" + lat + "/" + lng + "/" + category,
        function (data) {
            // Clear old markers
            clearMarkers();
            console.log("loaded");
            $("#map-container").addClass("loaded");
            // $("#gaia").addClass("loaded");
            map.setCenter({lat: parseFloat(lat), lng: parseFloat(lng)});
            // Iterate through locations, mapping each
            $.each(data, function(i, place) {
                // console.log(place.media);
                var thisLat, thisLng;
                if (place.latitude) {
                    thisLng = place.longitude;
                    thisLat = place.latitude;
                } else {
                    thisLng = place.loc.coordinates[0];
                    thisLat = place.loc.coordinates[1];
                }

                // console.log("this lat:" + thisLat + " lng:" + thisLng);
                var marker = new google.maps.Marker({
                    position: new google.maps.LatLng(parseFloat(thisLat), parseFloat(thisLng)),
                    map: map,
                    title: place.title,
                    media: place.media,
                    gaia_id: place._id
                });

                markers.push(marker);
                defaultIcon = marker.getIcon();

                // Add click listener to marker
                google.maps.event.addListener(marker, 'click', function() {
                    var emptyOrOldMedia = false;
                    for (var source in marker.media) {
                        if (marker.media.hasOwnProperty(source)
                            && marker.media[source].length <= 1) {
                            console.log(source);
                            emptyOrOldMedia = true;
                        }
                    }
                    if (!marker.info && emptyOrOldMedia) {
                        // marker hasn't been clicked, and has empty/old media
                        console.log("getting media from service");
                        // Get posts for this location, display them
                        $.getJSON("http://"  + serverIP + ":" + serverPort
                                + "/media/" + marker.gaia_id, marker.media,
                            function (data) {
                                console.log(data);
                                marker.info = "<h1>" + marker.title + "</h1>";

                                // Here I iterate over data.yelp, the array yelp data
                                if (data.yelp && data.yelp.length) {
                                    marker.info = formatYelp(marker.info, data.yelp);
                                }

                                // Here I iterate over data.instagram, the array if IG media
                                if (data.instagram) {
                                    marker.info = formatInstagram(marker.info, data.instagram);
                                }

                                // Iterate over other data.servicenames here, in the same form


                                updateCenterAndMarker(marker);
                                
                            });
                    } else if (!marker.info) {
                        console.log("has good media");
                        // marker hasn't been clicked, but has good media
                        marker.info = "<h1>" + marker.title + "</h1>";

                        // Here I iterate over data.yelp, the array yelp data
                        if (marker.media.yelp && marker.media.yelp.length) {
                            console.log(marker.media);
                            marker.info = formatYelp(marker.info, marker.media.yelp);
                        }

                        // Here I iterate over data.instagram, the array of IG media
                        if (marker.media.instagram) {
                            marker.info = formatInstagram(marker.info, marker.media.instagram);
                        }
                        console.log("past IG");
                        // Iterate over other data.servicenames here, in the same form


                        updateCenterAndMarker(marker);
                    } else {
                        console.log("clicked already");
                        // marker has been clicked
                        updateCenterAndMarker(marker);
                    }
                });
            });
        });
}

function formatYelp(output, data) {
    $.each(data, function(i, business) {
        if (business.image_url) {
            output += "<h3>Yelp review: ("
                + business.rating + " stars)</h3>";

            output += "<a class='yelp-link' target='_blank' href='" +
                business.url + "'><img src='" +
                business.image_url + 
                "' /></a>";
            $.each(business.reviews, function(i, review) {
                output += "<p>" + review.excerpt + "</p>";
            });
        }
    });
    return output;
}

function formatInstagram(output, data) {
    output += "<h3>Instagram posts:</h3>";
    $.each(data, function(i, post) {
        if (post.image_url) {
            output += "<a class='ig-link' target='_blank' href='" +
                post.link + "'><img src='" +
                post.image_url + 
                "' /></a>";
            }
    });
    return output;
}

function updateCenterAndMarker(marker) {
    var curCenter = map.getCenter();
    $("#map").addClass("with-info");
    $("#info-container").html(marker.info);
    $("#info").show();
    google.maps.event.trigger(map, 'resize');
    map.setCenter(curCenter);

    for (var i = 0; i < markers.length; i++) {
        markers[i].setIcon(defaultIcon);
    }
    marker.setIcon({
        size: new google.maps.Size(22, 40),
        scaledSize: new google.maps.Size(22, 40),
        url: "highlighted.png"
    });
}

function closeInfoWindow() {
    var curCenter = map.getCenter();
    $("#map").removeClass("with-info");
    $("#info").hide();
    google.maps.event.trigger(map, 'resize');
    map.setCenter(curCenter);

    for (var i = 0; i < markers.length; i++) {
        markers[i].setIcon(defaultIcon);
    }
}

function clearMarkers() {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
  }
  markers.length = 0;
}



})();
