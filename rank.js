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



//console.log(array);
//console.log("------------------------finish print 0");

var instagramSorter = [];
var yelpSorter = [];
var googleSorter = [];

var idArray = [];

for (var i in array){
	if(typeof array[i].id !='undefined'){//expand to do everything
		idArray.push( array[i].id);
	}
	
	if(typeof array[i].media.instagram !='undefined'){
		//nsole.log(array[i].media.instagram.length);
		var rank= { 
			id:		array[i].id,
			rating:	array[i].media.instagram.length
		};
		instagramSorter.push(rank);
		//InstagramRanking[array[i].id] = array[i].media.instagram.length;
	}
	
	if(typeof array[i].media.yelp !='undefined'){
		var rank = { 
			id: array[i].id,
			rating:array[i].media.yelp[0].rating
		};
		yelpSorter.push(rank);
	}
	
	if(typeof array[i].media.google !='undefined'){
		//console.log(array[i].media.google[0].rating);
		var rank = { 
			id: array[i].id,
			rating:array[i].media.google[0].rating
		};
		//googleRanking[array[i].id] = array[i].media.google[0].rating;
		googleSorter.push(rank);
	}
	

}

//Sort it all
instagramSorter.sort(function(a,b) { return parseFloat(a.rating) - parseFloat(b.rating) } );
yelpSorter.sort(function(a,b) { return parseFloat(a.rating) - parseFloat(b.rating) } );
googleSorter.sort(function(a,b) { return parseFloat(a.rating) - parseFloat(b.rating) } );


//console.log(instagramSorter);
//console.log(yelpSorter);
//console.log(googleSorter);
//console.log(idArray);

var RankingArray = {};

function arrayObjectIndexOf(myArray, searchTerm, property) {
    for(var i = 0, len = myArray.length; i < len; i++) {
        if (myArray[i][property] === searchTerm) return i;
    }
    return -1;
}

//Fills array (-1 means it does not exist)
for( var i = 0; i < idArray.length; i++){
	var id = idArray[i];
	var rank = {
		igRank: arrayObjectIndexOf(instagramSorter, id, 'id'),
		yelpRank: arrayObjectIndexOf(yelpSorter, id, 'id'),
		googleRank: arrayObjectIndexOf(googleSorter, id, 'id')
	}
	RankingArray[id] = rank;
}

//console.log(RankingArray);

//Deletes missing media (-1's)
for(var id in RankingArray){
	//console.log(id);
	//console.log(RankingArray[id]);
	if( RankingArray[id].igRank == -1){
		delete RankingArray[id].igRank;
	}
	
	if( RankingArray[id].yelpRank == -1){
		delete RankingArray[id].yelpRank;
	}
	
	if( RankingArray[id].googleRank == -1){
		delete RankingArray[id].googleRank;
	}
	
}

//console.log(RankingArray);

function isEmpty(obj) {
    for(var prop in obj) {
        if(obj.hasOwnProperty(prop))
            return false;
    }

    return true;
}
//console.log(idArray);

// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

//deletes any objects with no media
for(var id in RankingArray){
	if(isEmpty(RankingArray[id])){
		delete RankingArray[id];
		idArray.remove(idArray.indexOf(id));
	}
}

console.log(RankingArray);
//console.log(idArray);

var totalContests = .5 * instagramSorter.length * (instagramSorter.length-1) * yelpSorter.length * (yelpSorter.length-1) * googleSorter.length * (googleSorter.length-1);
//console.log(totalContests);

var PEstimatorObj = {};

for(var i = 0; i < idArray.length; i++){
	var id = idArray[i];
	var win = 0;
	//console.log(idArray[i]);
	if(typeof RankingArray[id].igRank != 'undefined'){
		win += RankingArray[id].igRank;
	}
	if(typeof RankingArray[id].yelpRank != 'undefined'){
		win += RankingArray[id].yelpRank;
	}
	if(typeof RankingArray[id].googleRank != 'undefined'){
		win += RankingArray[id].googleRank;
	}

	var LL = {
		win: win,
		oldP: win/totalContests,
		newP: 0
	};
	PEstimatorObj[id] = LL;
}

console.log(PEstimatorObj);



console.log("------------------------Begin calc");
function sumInverse(Pid, field) {
	var sum = 0;
	for(newId in RankingArray){
		if(Pid != newId){
			if(RankingArray[newId][field] || RankingArray[newId][field]==0){
				sum += 1/(PEstimatorObj[newId]['oldP'] + PEstimatorObj[Pid]['oldP']); 
				//console.log(RankingArray[id][field]);
			}
		}
	}
	PEstimatorObj[Pid]['newP'] += sum;
	//console.log(sum);
}


	//Calculate the sum of all inverses
	for(id in PEstimatorObj){
		//console.log(RankingArray[id].igRank);
		if(RankingArray[id].igRank >= 0){
			//console.log(id + ": ig");
			sumInverse(id,'igRank');
		}
		//console.log(RankingArray[id].yelpRank);
		if(RankingArray[id].yelpRank >= 0){
			//console.log(id + ": yp");
			sumInverse(id,'yelpRank');
		}
		//console.log(RankingArray[id].googleRank);
		if(RankingArray[id].googleRank >=0){
			//console.log(id + ": gg");
			sumInverse(id,'googleRank');
		}
	}

	console.log(PEstimatorObj);

	var Ptotal = 0;
	for(id in PEstimatorObj){
		PEstimatorObj[id]['oldP'] = PEstimatorObj[id]['win'] / PEstimatorObj[id]['newP'];
		PEstimatorObj[id]['newP'] = 0;
		Ptotal += PEstimatorObj[id]['oldP'];
	}

	for(id in PEstimatorObj){
		PEstimatorObj[id]['oldP'] = PEstimatorObj[id]['oldP']/Ptotal;
	}

	console.log(PEstimatorObj);

for(var i = 0; i < 10; i++){
	
		
	//Calculate the sum of all inverses
	for(id in PEstimatorObj){
		//console.log(RankingArray[id].igRank);
		if(RankingArray[id].igRank >= 0){
			//console.log(id + ": ig");
			sumInverse(id,'igRank');
		}
		//console.log(RankingArray[id].yelpRank);
		if(RankingArray[id].yelpRank >= 0){
			//console.log(id + ": yp");
			sumInverse(id,'yelpRank');
		}
		//console.log(RankingArray[id].googleRank);
		if(RankingArray[id].googleRank >=0){
			//console.log(id + ": gg");
			sumInverse(id,'googleRank');
		}
	}

	//console.log(PEstimatorObj);

	var Ptotal = 0;
	for(id in PEstimatorObj){
		PEstimatorObj[id]['oldP'] = PEstimatorObj[id]['win'] / PEstimatorObj[id]['newP'];
		PEstimatorObj[id]['newP'] = 0;
		Ptotal += PEstimatorObj[id]['oldP'];
	}

	for(id in PEstimatorObj){
		PEstimatorObj[id]['oldP'] = PEstimatorObj[id]['oldP']/Ptotal;
	}

	//console.log(PEstimatorObj);
}

console.log(PEstimatorObj);
console.log("10");
for(var i = 0; i < 100000; i++){
	
		
	//Calculate the sum of all inverses
	for(id in PEstimatorObj){
		//console.log(RankingArray[id].igRank);
		if(RankingArray[id].igRank >= 0){
			//console.log(id + ": ig");
			sumInverse(id,'igRank');
		}
		//console.log(RankingArray[id].yelpRank);
		if(RankingArray[id].yelpRank >= 0){
			//console.log(id + ": yp");
			sumInverse(id,'yelpRank');
		}
		//console.log(RankingArray[id].googleRank);
		if(RankingArray[id].googleRank >=0){
			//console.log(id + ": gg");
			sumInverse(id,'googleRank');
		}
	}

	//console.log(PEstimatorObj);

	var Ptotal = 0;
	for(id in PEstimatorObj){
		PEstimatorObj[id]['oldP'] = PEstimatorObj[id]['win'] / PEstimatorObj[id]['newP'];
		PEstimatorObj[id]['newP'] = 0;
		Ptotal += PEstimatorObj[id]['oldP'];
	}

	for(id in PEstimatorObj){
		PEstimatorObj[id]['oldP'] = PEstimatorObj[id]['oldP']/Ptotal;
	}

	//console.log(PEstimatorObj);
}

console.log(PEstimatorObj);



/*
  {
	"id":"a",
	"rank": "1",
    "media": {
      "yelp": [
        {
          "rating": 4,
        }
      ],
      "instagram": [
        {
          "num_likes": 29,
        },
        {
          "num_likes": 4,
        },
        {
          "num_likes": 10,
        }
      ]
    }
  },
  {
    "title": "Starbucks",
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
      "google": [
        {
          "rating": 3.8,
        }
      ]
    }
  },{
    "title": "Trebant",
    "media": {
      "yelp": [
        {
          "rating": 4.5,
        }
      ],
      "google": [
        {
          "rating": 3.7,
        }
      ]
    }
  }
]*/
