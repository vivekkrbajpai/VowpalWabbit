var vw = require('../index.js');
var client = vw.createClient(26542,'localhost');


// to get prediction 

client.getPrediction('x y z', function(err, result){
	
	if(!err){
	console.log("This is the prediction for x y z : ", result);
	}
})
