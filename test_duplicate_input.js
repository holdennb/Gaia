var request = require("request");
// var testString = '[ { "longitude": -122.313393,    "latitude": 47.669872,    "title": "Herkimer Coffee",    "category": [      "Coffee",      "coffee"    ],    "media": {      "yelp": [        {          "is_claimed": false,          "distance": 1857.7573420339,          "mobile_url": "http:\/\/m.yelp.com\/biz\/herkimer-coffee-seattle-2",          "rating_img_url": "http:\/\/s3-media4.fl.yelpcdn.com\/assets\/2\/www\/img\/c2f3dd9799a5\/ico\/stars\/v1\/stars_4.png",          "review_count": 102,          "name": "Herkimer Coffee",          "snippet_image_url": "http:\/\/s3-media3.fl.yelpcdn.com\/photo\/oxffqsJTLSKvRzcf_oi9Aw\/ms.jpg",          "rating": 4,          "url": "http:\/\/www.yelp.com\/biz\/herkimer-coffee-seattle-2",          "location": {            "cross_streets": "56th St & N Cowen Pl",            "city": "Seattle",            "display_address": [              "5611 University Way NE",              "University District",              "Seattle, WA 98105"            ],            "geo_accuracy": 8,            "neighborhoods": [              "University District"            ],            "postal_code": "98105",            "country_code": "US",            "address": [              "5611 University Way NE"            ],            "coordinate": {              "latitude": 47.669872,              "longitude": -122.313393            },            "state_code": "WA"          },          "phone": "2065255070",          "snippet_text": "Every Seattleite has a favorite coffee shop that is not Starbucks; this is mine. I spent a good portion of my summer here working on medical school...",          "image_url": "http:\/\/s3-media2.fl.yelpcdn.com\/bphoto\/1GUl1HsFoiP8aO4EQY06HQ\/ms.jpg",          "categories": [            [              "Coffee & Tea",              "coffee"            ]          ],          "display_phone": "+1-206-525-5070",          "rating_img_url_large": "http:\/\/s3-media2.fl.yelpcdn.com\/assets\/2\/www\/img\/ccf2b76faa2c\/ico\/stars\/v1\/stars_large_4.png",          "id": "herkimer-coffee-seattle-2",          "is_closed": false,          "rating_img_url_small": "http:\/\/s3-media4.fl.yelpcdn.com\/assets\/2\/www\/img\/f62a5be2f902\/ico\/stars\/v1\/stars_small_4.png"        }      ]    }  },{    "longitude": -122.313159592,    "latitude": 47.669815282,    "title": "Herkimer Coffee",    "category": [      "Coffee",      "Coffee Shop"    ],    "media": {      "instagram": [        {          "location_id": 238300892,          "post_id": "939255055658275729_16040019",          "text": "Jesse and Liz at #herkimercoffee. These two are hitchin up this summer. Were so happy to steal some small moments with them.",          "image_url": "http:\/\/scontent.cdninstagram.com\/hphotos-xfa1\/t51.2885-15\/e15\/11055518_701739366601174_978749578_n.jpg",          "link": "https:\/\/instagram.com\/p\/0I538qAFOR\/",          "num_likes": 29,          "date": "Thu Mar 12 2015 12:19:09 GMT-0700 (PDT)"        },        {          "location_id": 238300892,          "post_id": "939188184456032635_414724027",          "text": "#sister #babe in #Seattle",          "image_url": "http:\/\/scontent.cdninstagram.com\/hphotos-xfa1\/t51.2885-15\/e15\/11049353_1059442707405878_2063409850_n.jpg",          "link": "https:\/\/instagram.com\/p\/0Iqq1_vvF7\/",          "num_likes": 22,          "date": "Thu Mar 12 2015 10:06:17 GMT-0700 (PDT)"        }      ]    }  }]';
var testString = [{"longitude": -122.313159592,"latitude": 47.669815282,"title": "Herkimer Coffee","category": ["Coffee","Coffee Shop"],"source": "instagram", "media": [{"location_id": 238300892,"post_id": "a"},{"location_id": 238300892,"post_id": "b"}]}, {"longitude": -122.313393,"latitude": 47.669872,"title": "Herkimer Coffee","category": ["Coffee", "coffee", "cafey"], "source":"yelp", "media": [{"a": false},{"a": 1857.7573420339}]}];
var testString_sub1 = {"longitude": -122.313159592,"latitude": 47.669815282,"title": "Herkimer Coffee","category": ["Coffee","Coffee Shop"],"source": "instagram", "media": [{"location_id": 238300892,"post_id": "a"},{"location_id": 238300892,"post_id": "b"}]};
var testString_sub2 = {"longitude": -122.313393,"latitude": 47.669872,"title": "Herkimer Coffee","category": ["Coffee", "coffee"], "source":"yelp", "media": [{"a": false},{"a": 1857.7573420339}]};

// "media": {"yelp": [{"a": false},{"a": 1857.7573420339}]}},
// [{"longitude": -122.313393,"latitude": 47.669872,"title": "Herkimer Coffee","category": ["Coffee", "coffee"],
// "media": {"yelp": [{"a": false},{"a": 1857.7573420339}]}},
// {"longitude": -122.313159592,"latitude": 47.669815282,"title": "Herkimer Coffee","category": ["Coffee","Coffee Shop"],
// "media": {"instagram": [{"location_id": 238300892,"post_id": "a"},{"location_id": 238300892,"post_id": "b"}]}}];

request.post({
    uri: "http://127.0.0.1:3000/itemstest",
    headers: {'content-type': 'application/json'},
    body: JSON.stringify(testString)
}, function(err, result, body){
    console.log("YAY got back: " + body);
    
});

// request.post({
//     uri: "http://127.0.0.1:3000/itemstest",
//     headers: {'content-type': 'application/json'},
//     body: JSON.stringify(testString_sub1)
// }, function(err, result, body){
//     console.log("YAY got back: " + body);
    
// });

// request.post({
//     uri: "http://127.0.0.1:3000/itemstest",
//     headers: {'content-type': 'application/json'},
//     body: JSON.stringify(testString_sub2)
// }, function(err, result, body){
//     console.log("YAY got back: " + body);
    
// });


