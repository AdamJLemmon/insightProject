/* 
	Module containing all private methods to interact with blockchain
*/
var YAML = require('yamljs');

var utils = require('../utils/jsBaseUtils');

var constants = YAML.load('./constants.yml');
var settings = YAML.load('../settings.yml');


var blockchain = {
	// Local references to the contract instances, regsitry, parties, reservations
	// Key is the contractId
	contractIdToInstance: {},
}


function contractDeploymentCallback(e, contract, contractId){
	/*
		Helper utilized when deploying a contract
		- contract: contract instance in the process of being deployed
		- contractId: the type of contract, registry for example, defines 
		the listener method to invoke
	*/
	if(!e) {
		if(!contract.address) {
		  utils.debugLogOutput("Contract transaction sent: TransactionHash: " + contract.transactionHash + " waiting to be mined...");
		} else {
			utils.debugLogOutput("Contract mined! Address: " + contract.address);


			// create corresponding listeners for the registry contract events
			if (contractId == constants.REGISTRY_CONTRACT){
				blockchain.contractIdToInstance[contractId] = contract;
				// this._createRegistryListeners(contract);

				// save reference to the new registry contract within object
				// this._contracts[constants.REGISTRY_CONTRACT] = contract;

				console.log('contract.getState()');
				console.log('contract.getState()');
				console.log('contract.getState()');
				console.log(contract.getState.call(contract.data));
			}
		}
	} // end contract addr if
	else {
		console.log("err: " + e)
	}
}

function loadContract(web3, itemId, itemType, address){
	/* 
		Load a contract instance
		Lookup contract data and interface based on type and then instantiate at address
		- itemType: the type of contract it is, product, party, registry for example
	*/
	utils.debugLogOutput('Loading Contract: ' + itemId + ' at address: ' + address);
	
	var contract = null;
	var interface = settings.contractData[itemType].interface;

	// if address exists meaning it has been deployed then grab instance
	if (address){
		var contract = web3.eth.contract(interface).at(address);

		// Hold local reference to this instance
		blockchain.contractIdToInstance[itemId] = contract;

		// create event listeners for the loaded contracts
		// currently party, product, registry have unique listeners
		// specific listeners and logic for both registry and product contracts
		// if (itemType == constants.REGISTRY_CONTRACT)
		// 	this._createRegistryListeners(contract);
		
		// else if(itemType == constants.PRODUCT_CONTRACTS)
		// 	this._creatProductListeners(contract);

		// else if(itemType == constants.PARTY_CONTRACTS)
		// 	this._creatPartyListeners(contract);
	}


	return contract.address;
}

function partyAddReservation(web3, partyId, resoId, resoSource, resoDest, expectedStates){
	/*
		Add a reservation to a party
		Will add the party first if it does not exist
	*/
	utils.debugLogOutput('Add reso:' + resoId + ' to party: ' + partyId);

	// If there is no registry, cannot continue
	if (!(constants.REGISTRY_CONTRACT in blockchain.contractIdToInstance)){
		utils.errorLogOutput('Error: Registry Does not exist!');
		return;
	} 

	// Add / get the party if it is not already loaded
	if (!(partyId in blockchain.contractIdToInstance)){
		utils.debugLogOutput('Party does not exist locally');

		// Wait for the party to be created than may add the reservation
		partyGetOrAdd(web3, partyId, function(){
			partyAddReservation(web3, partyId, resoId, resoSource, resoDest, expectedStates);
		});
	}

	// Finally add the reservation
	utils.debugLogOutput('Adding Reservation!');


	return partyId;
}

function partyGetOrAdd(web3, partyId, callback){
	/*
		Get the party into local object
		Contract will either get it or create if it does not exists
		Returning the address
	*/
	utils.debugLogOutput('PartyGetOrAdd: ' + partyId);

	// Grab reference to the registry instance
	var registry = blockchain.contractIdToInstance[constants.REGISTRY_CONTRACT];

	// Init the account to send the transaction
	var owner = setupFuelingAccountForTransaction(
		web3, constants.FUELING_ACCOUNT, constants.FUELING_PASSWORD
	);

	var partyAddress = registry.partyGetorAdd.sendTransaction(partyId, 
		{
			from: owner,
			gas: 1000000
		}, function(err, res){
			console.log('Party address err: ' + err);
			console.log('Party address res: ' + res);
		}
	)
}

function setupFuelingAccountForTransaction(web3, account, password){
		/*
			Helper to unlock account to send transactions
		*/
		// TODO: confirm account balance!
		web3.personal.unlockAccount(account, password);
		return account;
}


// Visible by the API module
module.exports = {
	contractDeploymentCallback: contractDeploymentCallback, 
	loadContract: loadContract,
	partyAddReservation: partyAddReservation,
	setupFuelingAccountForTransaction: setupFuelingAccountForTransaction,	
}

