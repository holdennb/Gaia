var request = require("request");

request.get({
    uri: "http://128.208.1.140:3000/gaiadb?format=json",
    headers: {'content-type': 'application/json'}
}, function(err, result, body){
    console.log("YAY got back: " + body);
    // body is an array of objects from the DB

    // traverse the body... 

    // TO call to update the rank
    // var new_rank = 3;
    // 
	// request.put({
	//     uri: "http://localhost:3000/itemstest/updateRank?id=550aa4a39af773c7176eaaba&value=0.55",
	//     headers: {'content-type': 'application/json'},
	//     body: JSON.stringify('')
	// }, function(error, result, doc){
	//     console.log("YAY got back: " + doc);
	// });
    
});
