var jayson = require('jayson');
// var mailer = require('nodemailer'); // module to send notification emails
var YAML = require('yamljs');
var Web3 = require('web3'); // ethereum interface

var blockchain = require('./blockchain')
var utils = require('../utils/jsBaseUtils');
var web3Utils = require('../utils/web3');

var constants = YAML.load('./constants.yml');
var settings = YAML.load('../settings.yml');


// connect to local geth node
var web3 = new Web3(
	new Web3.providers.HttpProvider("http://localhost:8545")
);



// ***************
// * EXPOSED API *
// ***************
/* TODOS:
	- compute required gas for transactions
	-
*/


function deployContract(args, callback) {
	/*
		Deploy a specific contract, interface and data looked up in constants
		based on id, note utilized to deploy registry initially
		- contractId: id used to lookup contract info; interface, data
	*/
	var contractId = args[constants.ID];
	utils.debugLogOutput('Deploying contract: ' + contractId);

    // Init user account, unlock account and set default
    var ownerAddr = blockchain.setupFuelingAccountForTransaction(
    	web3, constants.FUELING_ACCOUNT, constants.FUELING_PASSWORD
	);

    // retrieve data and interface
    var contractObject = web3.eth.contract(
    	settings.contractData['libraries'][contractId][constants.INTERFACE]
	)

    // estimate gas for contract
    var gasEstimate = web3.eth.estimateGas({
    	data: settings.contractData['libraries'][contractId][constants.DATA]
    });

    // instantiate and deploy contract
	contractObject.new(
		{
			from: ownerAddr,
			data: settings.contractData['libraries'][contractId]['data'],
			gas: gasEstimate*2
		}, function (e, contract){
			blockchain.contractDeploymentCallback(e, contract, contractId);
	})

    callback(null, gasEstimate);
}


// Object organzied as follows: Public then private attributes, public then private methods
// Alphabetical within sections
var publicApi = {
	// Note: this is the json rpc server within this object

	// Not to be included / exposed in prod
	deployContract: function (args, callback) {
		/*
			Deploy a specific contract, interface and data looked up in constants
			based on id, note utilized to deploy registry initially
			- contractId: id used to lookup contract info; interface, data
		*/
		var contractId = args[constants.ID];
		utils.debugLogOutput('Deploying contract: ' + contractId);

	    // Init user account, unlock account and set default
	    var ownerAddr = blockchain.setupFuelingAccountForTransaction(
	    	web3, constants.FUELING_ACCOUNT, constants.FUELING_PASSWORD
    	);

	    // retrieve data and interface
	    var contractObject = web3.eth.contract(
	    	settings.contractData[contractId][constants.INTERFACE]
    	)

	    // estimate gas for contract
	    var gasEstimate = web3.eth.estimateGas({
	    	data: settings.contractData[contractId][constants.DATA]
	    });

	    // instantiate and deploy contract
		contractObject.new(
			{
				from: ownerAddr,
				data: settings.contractData[contractId]['data'],
				gas: gasEstimate*2
			}, function (e, contract){
				blockchain.contractDeploymentCallback(e, contract, contractId);
		})

	    callback(null, gasEstimate);
	},

	deployLibraries: function(args, callback){
		/*
			Iterate over all libraries in settings and deploy
		*/
		var libraries = settings.contractData['libraries'];

		utils.debugLogOutput('Deploying Libraries: ');
		utils.debugLogOutput(libraries);

		for(lib in libraries){
			console.log('Lib: ' + lib);
			deployContract({
				'id': lib,
			}, callback);
		}
	},

	loadRegistryContract: function(args, callback){
		/*
			Quickly load a deployed registry contract into loca server object
		*/
		var response = blockchain.loadContract(
		 	web3,
		 	constants.REGISTRY_CONTRACT,
		 	constants.REGISTRY_CONTRACT,
		 	settings.contractData[constants.REGISTRY_CONTRACT].address
		);

		callback(null, response);
	},

	partyAddReservation: function(args, callback){
		/*
			Add a reservation to the specified party
			Will create the party if it does not exist
		*/
		// Pull params out of args
		var partyId = args[constants.PARTY_ID];
		var resoId = args[constants.RESO_ID];
		var resoSource = args[constants.RESO_SRC];
		var resoDest = args[constants.RESO_DEST];
		var expectedStates = args[constants.RESO_EXPECTED_STATES];

		var response = blockchain.partyAddReservation(
			web3, partyId, resoId, resoSource, resoDest, expectedStates
		);
		callback(null, response);
	},
}


// JSON RPC http Server
var server = jayson.server(publicApi);
var serverPort = settings[constants.JSON_RPC][constants.PORT];
server.http().listen(serverPort);
utils.debugLogOutput('Blockchain API Server Listening on: ' + serverPort);
