# Load fake reservations for demo

import yaml


class Demo:

    def __init__(self):
        # settings yml loaded to dict
        self.settings = self.__load_demo_settings__()

    @staticmethod
    def __load_demo_settings__():
        """
        Load and return demo specific settings
        """
        settings_file = open('demo/settings.yml')
        settings = yaml.safe_load(settings_file)
        settings_file.close()

        return settings


if __name__ == '__main__':
    pass


