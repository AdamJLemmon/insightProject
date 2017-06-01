/* 
    @adamlemmon 04122017

    All contracts arranged alphabetically
    Contents of all sections of contracts arranged alphabetically; events, public methods, etc.

    Contents:
    - Base classes; Base, RegistryItem
    - Registry
    - Party

    Function interface is as follows: function name(params) modifiers visibility returns() {}

    Methods are labelled as: itemtypeAction, ex. partyAdd is adding a form
*/

pragma solidity ^0.4.10;


/* 
	All mapping to indexes default to uint8, 0 - 255, may have 256 items

    TODO:  
		1. Define ownership of party contracts, default to registry or now.
		2. Define Ownership of reservations, airport, airline? 
        X. MODIFIERS!! Permission all public and external
        Y. Fallbacks and suicides
*/


/******************
* UTILS LIBRARIES *
******************/
// String parsing, concat, split, etc.
import "github.com/Arachnid/solidity-stringutils/strings.sol";

library Utils {
	/*
		Generic utils
	*/
	function convertStringtoBytes32(string source) returns(bytes32 result){
		/*
			Explicilty convert a string to bytes32
		*/
		assembly {
                result := mload(add(source, 32))
        }
	}
}

library PartyUtils {
    /*
        Utils specific to each party contract
        Data parameter is storage object
        Each Data storage object passed in is the contract's
        data storage struct of the calling contract
    */
    struct Data {
    	mapping(bytes32=>uint8) resoIdToIndex; // Lookup specific reservation by id
    	address[] reservations; // Array of actual reservation contracts
    }


    /* VISIBLE METHODS */
    function reservationAdd(
    	Data storage self, 
    	bytes32 id, 
    	bytes32 source, 
    	bytes32 dest, 
    	string expectedStates
	){
        /*
            Add a new reservation for this party
            - id: unique id for this reservation to lookup in future
            - source: Where from
            - dest: Where to
            - expectedStates: states in between src and dst
        */
        self.resoIdToIndex[id] = uint8(self.reservations.length);

        // TODO: create actual reso
        self.reservations.push(new Reservation(source, dest, expectedStates));
    }


    /* PRIVATE METHODS */
}

library RegistryUtils {
    /*
        Library specific to registries
        Data parameter is storage object
        Each Data storage object passed in is the contract's
        data storage struct of the calling contract
    */

    // Reference to all existing items; parties etc. that may exist
    // Map id to contract address
    // Use unique identifier for all items
    // If we need total # of items or to return all must use array 
    // for addresses and mapping for lookup
    struct Data {
        mapping(bytes32=>address) itemIdToAddress;
    }


    /* VISIBLE METHODS */
    function partyAdd(Data storage self, bytes32 partyId){
        /*
            Add new party contract into contract storage
        */
        if (itemContractExists(self, partyId)) throw; // Party already exists!

        // Instantiate a new Party contract and store addr in mapping
        self.itemIdToAddress[partyId] = new Party();
    }

    function partyGetorAdd(Data storage self, bytes32 partyId) returns(address){
        /*
            Get and return address of party contract
            Add new if it does not exist
            - partyId: unique id for this party
        */
        // Doesn't exist so add new
        if (!(itemContractExists(self, partyId))){
        	partyAdd(self, partyId);
        }

        return self.itemIdToAddress[partyId]; 
    }

    function itemContractExists(Data storage self, bytes32 id) returns(bool){
        /*
            Lookup appropriate map to search based on the type of item
            Within mapping check that the id exists as a valid address  
            Note addresses default to address(0x0)
            Cannot compare string direct so take the hash
            - id: unique identifier for the item
        */
        if(self.itemIdToAddress[id] == address(0x0)){
            return false;
        }
        else {
            return true;
        }
    }


    /* PRIVATE METHODS */
}

library ReservationUtils {
	/*
		Reso..	
	*/
	using strings for *;

	struct Data {
		// The party contract this reso belongs too
	    // Party to reso is 1 to many mapping
	    address party;

	    bytes32 source; // When this reservation begins
	    bytes32 destination; //Where this reservation ends
	    bytes32[] expectedStates; // The intermediate planned states
	}

	function expectedStatesAdd(Data storage self, string statesString){
		/*
			Create the array of expected states from the passed in string
		*/
		parseStatesStringToArray(self, statesString);
	}

	function parseStatesStringToArray(Data storage self, string statesString) private {
		/*
			Parse string to pull out all states, 's1, s2,' => ['s1', 's2']
			and append to array
			- stateString: concat string of all states
		*/
	    var slice = statesString.toSlice();
	    var delim = ",".toSlice();

	    // Define how many states exist
	    var states = slice.count(delim);
	    
	    string memory stateString;
	    
	    // populate array with states if any
	    if (states > 0 ){
	        for(var i = 0; i < states; i++) {
	            stateString = slice.split(delim).toString();
	           
	            // Convert to bytes32 for storage
                self.expectedStates.push(
                	Utils.convertStringtoBytes32(statesString)
            	);                
	        }
	    }
	}
}


/*****************
* BASE CONTRACTS *
******************/
contract Base {
    /* STATE VARS */
    address owner;

    /* EVENTS */
    event itemActionEvent(bytes32 itemType, bytes32 eventType, bytes32 itemId);

    /* Modifiers */
    modifier onlyOwner {
        /*
            The eth account that is sending the transaction much be the same address
            as what has been set as owner
            Generally the address that created the contract, set in constructor
        */
        if (msg.sender == owner)_;
    }
}


/***********
* REGISTRY *
************/
contract Registry is Base {
    /*
        Managerial contract to handle all existing parties and other items  
    */
    /* STATE VARS */
    RegistryUtils.Data data; // Parties lookued up by encrypted email
    

    /* CONSTRUCTOR */
    function Registry() public {
        /*
            NOTES
        */
        owner = msg.sender;
    }
    

    /* PUBLIC METHODS */
    function partyAdd(bytes32 partyId) onlyOwner external {
        /*
            Add a new and unique party to the registry
            - partyId: unique identifier for this party
            - partyOwnderAccount: eth account address, this is who will be the owner 
            of the party contract
        */
        RegistryUtils.partyAdd(data, partyId);
        itemActionEvent('party', 'Add', partyId);
    }

    function partyGetorAdd(bytes32 partyId) onlyOwner external returns(address party){
        /*
            Get the contract address if it exists or create a new party
            - partyId: unique identifier for this party
            - partyOwnderAccount: eth account address, this is who will be the owner 
            of the party contract
        */
        party = RegistryUtils.partyGetorAdd(data, partyId);
        itemActionEvent('party', 'GetorAdd', partyId);
    }
}


/********
* PARTY *
*********/
contract Party is Base {
    /* STATE VARS */
    PartyUtils.Data data;


    /* EVENTS */
    /* MODIFIERS */


    /* CONSTRUCTOR */
    function Party(){
        /*
            - _owner: TODO define ownership
        */
        owner = msg.sender;
    }


    /* PUBLIC METHODS */
    function reservationAdd(
    	bytes32 resoId, 
    	bytes32 source, 
    	bytes32 dest, 
    	string expectedStates
	) {
    	/*
			Add a new reservation booking to this party 
    	*/
    	PartyUtils.reservationAdd(data, resoId, source, dest, expectedStates);
    	itemActionEvent('reservation', 'Add', resoId);
    }


    /* PRIVATE METHODS */
}


/**************
* RESERVATION *
**************/
contract Reservation is Base {
    /* STATE VARS */
    ReservationUtils.Data data;


    /* EVENTS */
    /* MODIFIERS */


    /* CONSTRUCTOR */
    function Reservation(bytes32 _source, bytes32 _dest, string expectedStates){
        /*
        	New reservation created and to be added to a party
        	- _source: Where the reservation begins
        	- _dest: Where the reservation ends
        	- expectedStates: the intermediated checkpoints and states this reservation 
        	should reach.  This are inherited by all backage etc.  Passed in as a string
        	and must be parsed into an array.
        */
        owner = msg.sender; // TODO
        data.party = msg.sender;

        data.source = _source;
        data.destination = _dest;

        // Need to parse the string passed in into associated array of states
        ReservationUtils.expectedStatesAdd(data, expectedStates);
    }


    /* PUBLIC METHODS */
    /* PRIVATE METHODS */
}