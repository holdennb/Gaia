(function() {

$(document).ready(function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            // Got current location!
            var lat = position.coords.latitude;
            var lng = position.coords.longitude;
            $("#current-lat").text(lat);
            $("#current-lng").text(lng);


            $.getJSON("http://127.0.0.1:3000/instagram/" + lat + "/" + lng,
                function (data) {
                    // $("#http-response").text(JSON.stringify(data));

                    var myLatlng = new google.maps.LatLng(lat, lng);
                    var mapOptions = {
                        zoom: 16,
                        center: myLatlng
                    }
                    var map = new google.maps.Map(document.getElementById('map'), mapOptions);

                    $.each(data, function(i, val) {

                        var marker = new google.maps.Marker({
                            position: new google.maps.LatLng(val.lat, val.lng),
                            map: map,
                            title: 'An instagram location!'
                        });
                    })
                });
        });
    } else { 
        // Can't get current location :/
        $("#error p").text("Geolocation is not supported by this browser.");
    }
});


})();