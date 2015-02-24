(function() {
$(document).ready(function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            // Got current location!
            var lat = position.coords.latitude;
            var lng = position.coords.longitude;
            processRequest(lat,lng)    
        });
    } else {
        // Can't get current location :/
        $("#error p").text("Geolocation is not supported by this browser. Please use address.");
    }

    $("#address-form").submit(function(event) {
        event.preventDefault();
        $.getJSON("http://maps.googleapis.com/maps/api/geocode/json?address="
            + encodeURIComponent($("#address").val()),
            function(data) {
                console.log(data.results);
                if (data.results.length == 1) {
                    processRequest(data.results[0].geometry.location.lat,
                        data.results[0].geometry.location.lng);
                } else if (data.results.length > 1) {
                    $("#top-three").html("");
                    for (var i = 0; i < Math.min(4, data.results.length); i++) {
                        var result = data.results[i];
                        var item = $("<li></li>");
                        item.attr("data-lat", result.geometry.location.lat);
                        item.attr("data-lng", result.geometry.location.lng);
                        item.text(result.formatted_address);
                        item.click(function() {
                            $(this).siblings().removeClass("active");
                            $(this).addClass("active");
                            processRequest($(this).attr("data-lat"), $(this).attr("data-lng"));
                        });

                        $("#top-results, #top-three").show();
                        $("#top-three").append(item);
                    }
                } else {
                    $("#error p").text("Address not found.");
                }
            });
    });
});

function processRequest(lat, lng) {
    $("#current-lat").text(lat);
    $("#current-lng").text(lng);

    // Set up google map
    var current_loc = new google.maps.LatLng(lat, lng);
    var mapOptions = {
        zoom: 14,
        center: current_loc
    }
    var map = new google.maps.Map(document.getElementById('map'), mapOptions);
    var infowindow = new google.maps.InfoWindow();

    // Query server to get JSON for locations
    $.getJSON("http://127.0.0.1:3000/ig_places/" + lat + "/" + lng,
        function (data) {
            // $("#http-response").text(JSON.stringify(data));

            // Iterate through locations, mapping each
            $.each(data, function(i, place) {
                var marker = new google.maps.Marker({
                    position: new google.maps.LatLng(place.latitude, place.longitude),
                    map: map,
                    title: place.title
                });
                // console.log(marker.ig_place_id);
                marker.ig_place_id = place.description;

                // Add click listener to marker
                google.maps.event.addListener(marker, 'click', function() {
                    if (!marker.info) {
                        // Get posts for this location, display them
                        $.getJSON("http://127.0.0.1:3000/ig_media/" + marker.ig_place_id,
                            function (data) {
                                marker.info = "<h1>" + marker.title + "</h1>";
                                $.each(data, function(i, post) {
                                    marker.info += "<a target='_blank' href='" +
                                        post.link + "'><img src='" +
                                        post.images.thumbnail.url + 
                                        "' /></a><br />";
                                });
                                infowindow.setContent(marker.info);
                                infowindow.open(map,marker);
                            });
                    } else {
                        infowindow.setContent(marker.info);
                        infowindow.open(map,marker);
                    }
                });
            });
        });
}


})();