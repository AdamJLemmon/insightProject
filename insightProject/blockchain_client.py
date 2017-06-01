# Class to handle all things blockchain
import time

from insightProject.constants import *
from utils.py_base_utils import load_settings, send_json_rpc_request


class BlockchainClient:

    def __init__(self):
        self.settings = load_settings()

    def add_reservation_to_party(self, email, reservation, encrypt):
        """
        Talk to blockchain api and add this reservation to this user's contract
        email: unique identifier entered by user
        reservation: information dict regarding this reservation
        encrypt: whether or not he user wants their info encrypted
        """
        # TODO: encrypt the email
        party_id = email

        print('Party:', party_id)
        print('Reso:', reservation)

        response = send_json_rpc_request(
            ip=self.settings[JSON_RPC][IP],
            port=self.settings[JSON_RPC][PORT],
            method=ADD_RESO_TO_PARTY,
            params={
                PARTY_ID: party_id,
                RESO_ID: reservation[ID] + '-' + str(time.time() * 1000),  # add timestamp to ensure unique
                RESO_SRC: reservation[SRC],
                RESO_DEST: reservation[DESTINATION],
                RESO_EXPECTED_STATES: reservation[EXPECTED_STATES]
            },
            rpc_version=self.settings[JSON_RPC][VERSION],
            req_id=0
        )

        print('Res:', response)

    def deploy_registry(self):
        """
        Helper method in order to quickly deploy the registry
        """
        contract_id = REGISTRY_CONTRACT

        response = send_json_rpc_request(
            ip=self.settings[JSON_RPC][IP],
            port=self.settings[JSON_RPC][PORT],
            method=DEPLOY_CONTRACT,
            params={
                ID: contract_id
            },
            rpc_version=self.settings[JSON_RPC][VERSION],
            req_id=0
        )

        print('Res:', response)

    def deploy_libraries(self):
        """
        Helper method in order to quickly deploy all libraries
        """
        response = send_json_rpc_request(
            ip=self.settings[JSON_RPC][IP],
            port=self.settings[JSON_RPC][PORT],
            method='deployLibraries',
            params={},
            rpc_version=self.settings[JSON_RPC][VERSION],
            req_id=0
        )

        print('Res:', response)

    def load_registry(self):
        """
        Helper method in order to quickly reload the registry into local server object
        """
        response = send_json_rpc_request(
            ip=self.settings[JSON_RPC][IP],
            port=self.settings[JSON_RPC][PORT],
            method=LOAD_REGISTRY,
            params=[],
            rpc_version=self.settings[JSON_RPC][VERSION],
            req_id=0
        )

        print('Res:', response)


if __name__ == "__main__":
    # pass
    b = BlockchainClient()
    # b.deploy_libraries()
    b.deploy_registry()
    # b.load_registry()

    email = 'adam@a.com'
    reservation = {
        'id': 'YYZ-MEL',
        'source': 'YYZ',
        'destination': 'MEL',
        'via': ['YVR'],
        'expectedStates': [
            'YYZ-checkIn',
            'YYZ-routing',
            'YYZ-loading',
            'YVR-offloading',
            'YVR-routing',
            'YVR-loading',
            'MEL-offloading',
            'MEL-routing',
            'MEL-carousel',
        ]
    }

    # b.add_reservation_to_party(email, reservation, True)

