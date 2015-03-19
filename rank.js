var array = [
	{
		"id": "a",
		"rank": "1",
		"media": {
			"instagram": [
				{
				  "num_likes": 29,
				},
				{
				  "num_likes": 4,
				},
				{
				  "num_likes": 10,
				},
				{
				  "num_likes": 6,
				},
				{
				  "num_likes": 42,
				},
				{
				  "num_likes": 1,
				}
		  ],
		   "yelp": [
				{
				  "rating": 4.5
				}
			  ],
			"google": [
				{
				  "rating": 3.5
				}
			  ]
		}
	},
	{
		"id": "b",
		"rank": "1",
		"media": {
			 "yelp": [
				{
				  "rating": 5
				}
			  ],
			  "google": [
				{
				  "rating": 2.5
				}
			  ]
		}
	},
	{
		"id": "c",
		"rank": "1",
		"media": {
			"instagram": [
				{
				  "num_likes": 29,
				},
				{
				  "num_likes": 4,
				},
				{
				  "num_likes": 10,
				},
				{
				  "num_likes": 6,
				},
				{
				  "num_likes": 1,
				}
			],
			 "google": [
				{
				  "rating": 3.9
				}
			  ]
		}
	},
	{
		"id": "d",
		"rank": "1",
		"media": {
			"instagram": [
				{
				  "num_likes": 29,
				},
				{
				  "num_likes": 4,
				},
				{
				  "num_likes": 1,
				}
		  ],
		   "yelp": [
				{
				  "rating": 3
				}
			  ],
		}
	},
	{
		"id": "e",
		"rank": "1",
		"media": {
			 "yelp": [
				{
				  "rating": 3
				}
			  ],
		}
	},
	{
		"id": "f",
		"rank": "1",
		"media": {
			"instagram": [
				{
				  "num_likes": 29
				}
			],
			"google": [
				{
				  "rating": 3.2
				}
			  ]
		}
	},
	{
		"id": "g",//no media
		"rank": "1",
		"media": {
		}
	}
]



var instagramSorter = [];
var yelpSorter = [];
var googleSorter = [];


var inputMethods = [];
inputMethods.push({mediaSource:'instagram', metric:'length'});
inputMethods.push({mediaSource:'yelp', metric:'rating'});
inputMethods.push({mediaSource:'google', metric:'rating'});

console.log(inputMethods);

var sorter = new Array(inputMethods.length);
var listContains = new Array(inputMethods.length);
for(var i = 0; i < inputMethods.length; i++){
	sorter[i] = [];
	listContains[i] = [];
}


//Separates each location by what meda it has to be used in sorting
for (var place in array){																	//for every location
	if(typeof array[place].id !='undefined'){												//check for null												///put into master set, get rid of later
		for(var src = 0; src < inputMethods.length; src++){	
			if(typeof array[place].media[inputMethods[src].mediaSource] !='undefined'){		//if the media exists
				var id = array[place].id;													
				var rating = 0;
				if( inputMethods[src].metric == 'length'){
					rating = array[place].media[inputMethods[src].mediaSource].length
				}else{
					rating = array[place].media[inputMethods[src].mediaSource][0].rating
				}
				sorter[src].push({'id': id, 'rating': rating});
			}
		}
	}
}

//Sort it all
for(var i = 0; i < sorter.length; i++){
	sorter[i].sort(function(a,b) { return parseFloat(a.rating) - parseFloat(b.rating) } );
}



instagramSorter = sorter[0];
yelpSorter = sorter[1];
googleSorter = sorter[2];

var RankingArray = {};

function arrayObjectIndexOf(myArray, searchTerm, property) {
    for(var i = 0, len = myArray.length; i < len; i++) {
        if (myArray[i][property] === searchTerm) return i;
    }
    return -1;
}

//Fills array (-1 means it does not exist)
/*
 { a: [ 3, 2, 2 ],
  b: [ -1, 3, 0 ],
  c: [ 2, -1, 3 ],
  d: [ 1, 0, -1 ],
  e: [ -1, 1, -1 ],
  f: [ 0, -1, 1 ],
  g: [ -1, -1, -1 ] }
*/
for (var place in array){	
	id = array[place].id;
	var rank = [];
	for(var i = 0; i < sorter.length; i++){
		rank.push(arrayObjectIndexOf(sorter[i], id, 'id'));
	}
	RankingArray[id] = rank;
}

console.log(RankingArray);
var PEstimatorObj = {};


//creates a list of what place has which service
/*
[ [ 'a', 'c', 'd', 'f' ],
  [ 'a', 'b', 'd', 'e' ],
  [ 'a', 'b', 'c', 'f' ] ]
*/
for(var i in RankingArray){
	var win = 0;
	for(var j = 0; j < sorter.length; j++){
		if(RankingArray[i][j] != -1){
			listContains[j].push(i);
			win += RankingArray[i][j];
		}
	}
	PEstimatorObj[i] = {
		'win': win,
		'oldP': win,
		'newP': 0
	};
}

console.log(listContains);

//calculate the total number of contests
var totalContests = 0.5;
for(var i = 0; i < listContains.length; i++){
	totalContests *= listContains[i].length * (listContains[i].length-1);
}
console.log(totalContests);
console.log(PEstimatorObj);

for(p in PEstimatorObj){
	PEstimatorObj[p].oldP = PEstimatorObj[p].oldP / totalContests;
}

console.log(PEstimatorObj);

console.log("------------------------Begin calc");
for(var iter = 0; iter < 100; iter++){
	for(id in PEstimatorObj){//for each place
		PEstimatorObj[id]['newP'] = 0;
		for(var i = 0; i < inputMethods.length; i++){	//for each service
			if(RankingArray[id][i]!=-1){				//if the list contains the number
				//console.log(i);
				for(var j = 0; j < listContains[i].length; j++){//for every place with that service
					if(listContains[i][j] != id){			//and they are not the same
						//console.log(listContains[i][j]);
						PEstimatorObj[id]['newP'] += 1/(PEstimatorObj[id]['oldP'] + PEstimatorObj[listContains[i][j]]['oldP']); 
					}
				}
			}
		}
	}

	//update
	var Ptotal = 0;
	for(id in PEstimatorObj){//for each place
		if(PEstimatorObj[id]['newP'] != 0){
			PEstimatorObj[id]['oldP'] = PEstimatorObj[id]['win'] / PEstimatorObj[id]['newP'];
			Ptotal += PEstimatorObj[id]['oldP'];
		}
	}

	for(id in PEstimatorObj){//for each place
		PEstimatorObj[id]['oldP'] /= Ptotal;
	}
}
console.log(PEstimatorObj);

