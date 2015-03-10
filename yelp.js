var yelp = require("yelp").createClient({
    consumer_key: "Py97HAoHM-vRPRNtyHDPdw",
    consumer_secret: "5Obi26U2Lxp9G-Lntig91RM5g_0",
    token: "Qm9upheoBhFYxPyCgMKEF8wF2zoj5p4G",
    token_secret: "DTO2S3wJuD_8HJw8TNa5mWk4a6o"
});

var lat = 47.6680304;
var lng = -122.3130834;

var minlon = lng - 5 * 0.00898311175/2/2;   // 5 km
var maxlon = lng + 5 * 0.00898311175/2/2;
var minlat = lat - 5 * 0.00898311175/2/2;
var maxlat = lat + 5 * 0.00898311175/2/2;
    
var json_out = [];



	
		for(Offset = 0; Offset < 981 ; Offset = Offset + 20){
			//console.log("current offset:   " + Offset);
			yelp.search({bounds: minlat+","+minlon+"|"+maxlat+","+maxlon, sort: "0", offset: Offset}, function(error, data) {
				if (error) {
					console.log("error:" + error);
					return;
				}
				for(var j in data['businesses']){
					var thisYelpPlace = data['businesses'][j];
					var location = {
						longitude: thisYelpPlace.location.coordinate.longitude,
						latitude: thisYelpPlace.location.coordinate.latitude,
						title: thisYelpPlace.name,
						category: thisYelpPlace.categories,
						source: "Yelp",
						location_id: thisYelpPlace.id
					}
					json_out.push(location);
				}
			});
		}
		





















