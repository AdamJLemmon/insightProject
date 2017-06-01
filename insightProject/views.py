import random
import threading

from django.http import HttpResponseRedirect
from django.views.generic import TemplateView

from demo.demo import Demo
from insightProject.blockchain_client import BlockchainClient
from insightProject.constants import *


# TODO: find a nice place for these
demo = Demo()
blockchain_client = BlockchainClient()


class BaseView(TemplateView):
    """
    Base view...
    """
    template_name = "base.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        # Reservation may exist
        reservation = self.request.GET.get(RESERVATION, None)

        # load the complete object if a reservation passed
        if reservation:
            reservation = demo.settings[RESERVATIONS][reservation]

        context['reservation'] = reservation

        return context


def fetch_reservation(request):
    """
    Retrieve the details of a user's reservation
    """
    email = request.POST.get('email', None)
    encrypt = request.POST.get('encrypt', None)

    # randomly select a reservation
    reservation_id = random.sample(list(demo.settings[RESERVATIONS]), 1)[0]
    reservation = demo.settings[RESERVATIONS][reservation_id]

    # Whether or not to encrypt the user's email to be published via events
    encrypt = True if encrypt else False

    # create thread to update the contract
    contract_thread = threading.Thread(
        target=blockchain_client.add_reservation_to_party,
        args=(email, reservation, encrypt)
    )
    contract_thread.daemon = True
    contract_thread.start()

    # Just pass the id of the reservation object, look it up in the actual view
    return HttpResponseRedirect('/Check?reservation={}#baggageCheck'.format(reservation_id))


