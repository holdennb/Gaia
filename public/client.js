(function() {

$(document).ready(function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            // Got current location!
            var lat = position.coords.latitude;
            var lng = position.coords.longitude;
            $("#current-lat").text(lat);
            $("#current-lng").text(lng);


            $.getJSON("http://127.0.0.1:3000/ig_places/" + lat + "/" + lng,
                function (data) {
                    // $("#http-response").text(JSON.stringify(data));

                    var current_loc = new google.maps.LatLng(lat, lng);
                    var mapOptions = {
                        zoom: 14,
                        center: current_loc
                    }
                    var map = new google.maps.Map(document.getElementById('map'), mapOptions);
                    var infowindow = new google.maps.InfoWindow();

                    $.each(data, function(i, place) {
                        // if (place.posts.length > 0) {
                            // var contentString = "";

                            // for (var i in place.posts) {
                            //     // console.log(place.posts[i]);
                            //     contentString += "<img src='" +
                            //         place.posts[i].images.thumbnail.url + 
                            //         "' /><br />";
                            // }


                            var marker = new google.maps.Marker({
                                position: new google.maps.LatLng(place.lat, place.lng),
                                map: map,
                                title: place.name
                            });
                            console.log(marker.ig_place_id);
                            marker.ig_place_id = place.ig_place_id;

                            google.maps.event.addListener(marker, 'click', function() {
                                if (!marker.info) {
                                    $.getJSON("http://127.0.0.1:3000/ig_media/" + marker.ig_place_id,
                                        function (data) {
                                            marker.info = "<h1>" + marker.title + "</h1>";
                                            $.each(data, function(i, post) {
                                                marker.info += "<img src='" +
                                                    post.images.thumbnail.url + 
                                                    "' /><br />";
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
        // Can't get current location :/
        $("#error p").text("Geolocation is not supported by this browser.");
    }
});


})();