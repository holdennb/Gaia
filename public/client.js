(function() {

var map = false;
var infowindow = false;
var markers = [];
var serverIP = "127.0.0.1";
var serverPort = "3000";

$(document).ready(function() {
    var lat;
    var lng;
    var category = encodeURIComponent($("#category").val());

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            // Got current location!
            lat = position.coords.latitude;
            lng = position.coords.longitude;
            processRequest(lat,lng, category)    
        });
    } else {
        // Can't get current location :/
        $("#error p").text("Geolocation is not supported by this browser. Please use address.");
    }

    // Change of address
    $("#address-form").submit(function(event) {
        event.preventDefault();
        $.getJSON("http://maps.googleapis.com/maps/api/geocode/json?address="
            + encodeURIComponent($("#address").val()),
            function(data) {
                $("#top-results, #top-four").hide();
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
                            $(this).siblings().removeClass("active");
                            $(this).addClass("active");
                            lat = encodeURIComponent($(this).attr("data-lat"));
                            lng = encodeURIComponent($(this).attr("data-lng"));
                            processRequest(lat, lng, category);
                        });

                        $("#top-results, #top-four").show();
                        $("#top-four").append(item);
                    }
                } else {
                    // Address not found
                    $("#error p").text("Address not found.");
                }
            });
    });

    // Change of category
    $("#category-form").submit(function(event) {
        event.preventDefault();
        category = encodeURIComponent($("#category").val());
        processRequest(lat, lng, category);
    });
});

// Reload map with current query
function processRequest(lat, lng, category) {
    $("#current-lat").text(lat);
    $("#current-lng").text(lng);

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
            map.setCenter({lat: parseFloat(lat), lng: parseFloat(lng)});
            // Iterate through locations, mapping each
            $.each(data, function(i, place) {
                var marker = new google.maps.Marker({
                    position: new google.maps.LatLng(place.coordinates[1], place.coordinates[0]),
                    map: map,
                    title: place.title,
                    ig_place_id: place.source_id
                });

                markers.push(marker);
                var defaultIcon = marker.getIcon();

                // Add click listener to marker
                google.maps.event.addListener(marker, 'click', function() {
                    if (!marker.info) {
                        // Get posts for this location, display them
                        $.getJSON("http://"  + serverIP + ":" + serverPort
                                + "/media/" + marker.ig_place_id,
                            function (data) {
                                marker.info = "<h1>" + marker.title + "</h1>";

                                // Here I iterate over data.instagram, the array if IG media
                                marker.info += "<h3>Instagram posts:</h3>";
                                $.each(data.instagram, function(i, post) {
                                    marker.info += "<a class='ig-link' target='_blank' href='" +
                                        post.link + "'><img src='" +
                                        post.images.thumbnail.url + 
                                        "' /></a>";
                                });

                                // Iterate over other data.servicenames here, in the same form


                                updateCenterAndMarker(marker, defaultIcon);
                                
                            });
                    } else {
                        updateCenterAndMarker(marker, defaultIcon);
                    }
                });
            });
        });
}

function updateCenterAndMarker(marker, defaultIcon) {
    var curCenter = map.getCenter();
    $("#map").addClass("with-info");
    $("#info").show().html(marker.info);
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

function clearMarkers() {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
  }
  markers.length = 0;
}



})();