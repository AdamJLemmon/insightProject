# Generic utilities required by the py application
import json
import requests
import yaml

from insightProject.constants import *


def load_settings():
    """
    Load the top level app settings yml and return as dict
    """
    # settings_file = open('settings.yml')

    # TODO only for testing when exec'ing client direct
    settings_file = open('../settings.yml')

    settings = yaml.safe_load(settings_file)
    settings_file.close()

    return settings


def send_json_rpc_request(ip, port, method, params, rpc_version, req_id):
    """
    Build and send a json rpc request
    """
    url = ip + port + '/' + JSON_RPC  # "http://localhost:3000/jsonrpc"
    headers = {CONTENT_TYPE: APP_JSON}

    # Example echo method
    payload = {
        METHOD: method,
        PARAMS: params,
        JSON_RPC: rpc_version,
        ID: req_id,
    }
    response = requests.post(
        url, data=json.dumps(payload), headers=headers
    ).json()

    return response
