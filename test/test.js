var vw = require('../index.js');
var expect = require('chai').expect;
describe('Vowpal wabbit connection test', function(){

		describe('Connect to the client', function(){

			it('should connect to the client', function(done){
				var client = vw.createClient(26542, 'localhost');
				client.on('connect',function(){

					expect(client.connectionOption.host).to.equal('localhost');
					expect(client.connectionOption.port).to.equal(26542);
					done();
					
					
				});

			});
		});

});
describe('Prediction Test', function(){

		it('should get the prediction for x y z', function(done){
			var client = vw.createClient(26542, 'localhost');
			client.getPrediction('x y z', function(err, result){
				console.log(result);
				expect(err).to.be.null;
				expect(result).to.equal('1.00000');
				done();
			})
		});
		it('should get the prediction for a b c', function(done){
			var client = vw.createClient(26542, 'localhost');
			client.getPrediction('a b c', function(err, result){
				expect(err).to.be.null;
				expect(result).to.equal('0.00000');
				done();
			})
		});
});