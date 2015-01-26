
var path = require("path");
var express = require("express");
var logger = require("morgan");
var app = express();
var ig = require("instagram-node").instagram();

// Log the requests
app.use(logger("dev"));

// Set up instagram credentials
ig.use({ client_id: '3f4a2693d5cc46a4b0686ae1e8df389a',
     client_secret: '57ed45f5db08440eb435d676208b4c34' });

// Serve static files
app.use(express.static(path.join(__dirname, "public"))); 

// Handle location request
app.get("/location/:lat/:lng", getResponse);

// Route for everything else.
app.get("*", function(req, res){
  res.send("404");
});

// Start server
app.listen(3000);
console.log("Listening on port 3000");

function getResponse(req, res) {

	ig.media_search(parseFloat(req.params.lat), parseFloat(req.params.lng),
		[Date.now() - 1000 * 60 * 60 * 24 * 2, Date.now(), 5000],
		function(err, medias, remaining, limit) {
			if (err) {
				res.send(err);
			} else {
				var out = "";
				for (var i = 0; i < medias.length; i++) {
					out += "<img src='" + medias[i].images.standard_resolution.url + "'>";
				}
				res.send(out);
			}
		});

}


















