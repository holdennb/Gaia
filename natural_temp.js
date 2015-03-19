var natural = require('natural');
var tokenizer = new natural.TreebankWordTokenizer();
natural.PorterStemmer.attach();

console.log("JaroWinklerDistance");
console.log(natural.JaroWinklerDistance("home,cafe","home,cafe"));
console.log(natural.JaroWinklerDistance("dixon","dicksonx"));
console.log(natural.JaroWinklerDistance('not', 'same'));

console.log("test for Gaia");
var s1 = "cafe Herikmer";
var s2 = "Herikmer's cafe";
var s1stem = s1.tokenizeAndStem().sort();
var s2stem = s2.tokenizeAndStem().sort();
console.log("just string: " + natural.JaroWinklerDistance(s1, s2));
console.log("after stemmed: " + natural.JaroWinklerDistance(s1stem, s2stem));

console.log("LevenshteinDistance");
console.log(natural.LevenshteinDistance("ones","onez"));
console.log(natural.LevenshteinDistance('one', 'one'));