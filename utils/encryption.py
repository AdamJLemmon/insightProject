# Utility class providing all encryption functionality
from cryptography.fernet import Fernet


class Encryption:

    def __init__(self):
        # TODO: create real encryption and define process
        self.key = Fernet.generate_key()

    def encrypt_string(self, string):
        """
        Encrypt a string utilizing secret encryption key
        :param string:
        :return:
        """
        f = Fernet(self.key)
        return f.encrypt(string.encode()).decode()

    def decrypt_string(self, string):
        """
        Decrypt a string utilizing secret encryption key
        :param string:
        :return:
        """
        f = Fernet(self.key)
        return f.decrypt(string)
