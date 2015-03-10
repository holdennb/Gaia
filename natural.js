var natural = require('natural'),
tokenizer = new natural.TreebankWordTokenizer();
natural.PorterStemmer.attach();
/*var one = "Starbuck's".tokenizeAndStem()
var two = "adobe Starbucks".tokenizeAndStem().sort()
var three = "uvillage's QFC".tokenizeAndStem().sort()
var four = "Starlife on the oasis".tokenizeAndStem().sort()

console.log(one);
console.log(two);
console.log(three);
console.log(four);


console.log(natural.JaroWinklerDistance(one,two))

console.log(natural.JaroWinklerDistance(three,two))

console.log(natural.JaroWinklerDistance(four,two))

console.log(natural.JaroWinklerDistance(one,four))


var location = {
						longitude: 1,
						latitude: 2,
						title: "tokanize this title",
						category: "",
						source: "src",
						location_id: "this-is-an-id"
					}
					
json_out = [];
json_out.push(location);

location = {
						longitude: 3,
						latitude: 4,
						title: "another title's to",
						category: "food",
						source: "src2",
						location_id: "this-is-another-id"
					}
json_out.push(location);*/

for(var i = 0; i < json_out.length; i++){
	console.log(json_out[i]);
	json_out[i].title = json_out[i].title.tokenizeAndStem().sort();
}

console.log(json_out);
