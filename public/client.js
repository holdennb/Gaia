(function() {
$(document).ready(function() {
    console.log("doc ready");
    if (navigator.geolocation) {
        console.log("location good");
        navigator.geolocation.getCurrentPosition(function(position) {
            console.log("got location");
            // Got current location!
            var lat = position.coords.latitude;
            var lng = position.coords.longitude;
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
            console.log("about to request");
            $.getJSON("http://127.0.0.1:3000/ig_places/" + lat + "/" + lng,
                function (data) {
                    console.log(data);
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
                });
    } else {
        console.log("location bad");
        // Can't get current location :/
        $("#error p").text("Geolocation is not supported by this browser.");
    }
});


})();