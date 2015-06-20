Nodejs client for vowpal wabbit
===============================

This is nodejs client to access vowpal wabbit running in daemon mode. This is work in progess and not completly ready yet.


		npm install vowpal-wabbit


## Usages:


		var vw = require('vowpal-wabbit'),
		client = vw.createClient(26542,'localhost');

		client.getPrediction('x y z', function(err, result){
				console.log("Prediction for x y z is : ",result )
			});

## To Do 

	* Support to return lable with prediction
	* function for tarining the model 
	

Copyright (c) 2015 Vivek Bajpai


