from .restapis import get_request, analyze_review_sentiments, post_review
from django.views.decorators.http import require_GET, require_POST
import requests
from urllib.parse import quote
from .populate import initiate
from .models import CarModel
import json
import logging

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import IntegrityError
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

logger = logging.getLogger(__name__)


def read_json(request):
    """Accept a JSON object and return helpful errors for invalid bodies."""
    try:
        data = json.loads(request.body)
    except (ValueError, UnicodeDecodeError):
        raise ValueError("A valid JSON request body is required.")
    if not isinstance(data, dict):
        raise ValueError("The request body must be a JSON object.")
    return data


def required_text(data, field):
    value = data.get(field)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{field} is required.")
    return value


@csrf_exempt
def login_user(request):
    if request.method != "POST":
        return JsonResponse({"error": "Use POST to log in."}, status=405)
    try:
        data = read_json(request)
        username = required_text(data, "userName").strip()
        password = required_text(data, "password")
    except ValueError as error:
        return JsonResponse({"error": str(error)}, status=400)

    user = authenticate(request, username=username, password=password)
    if user is None:
        return JsonResponse(
            {"userName": "", "error": "Invalid username or password."},
            status=401,
        )
    login(request, user)
    return JsonResponse({"userName": user.username, "status": "Authenticated"})


def logout_request(request):
    # GET is used here to match this course's required logout endpoint.
    if request.method != "GET":
        return JsonResponse({"error": "Use GET to log out."}, status=405)
    logout(request)
    return JsonResponse({"userName": ""})


def session_user(request):
    """Check the actual Django session rather than browser storage alone."""
    username = request.user.username if request.user.is_authenticated else ""
    return JsonResponse({"userName": username})


@csrf_exempt
def registration(request):
    if request.method != "POST":
        return JsonResponse({"error": "Use POST to register."}, status=405)
    try:
        data = read_json(request)
        username = required_text(data, "userName").strip()
        password = required_text(data, "password")
        first_name = required_text(data, "firstName").strip()
        last_name = required_text(data, "lastName").strip()
        email = required_text(data, "email").strip()
        validate_email(email)
        if len(username) > 150:
            raise ValueError("Username must contain at most 150 characters.")
        if len(first_name) > 150 or len(last_name) > 150:
            raise ValueError("Names must contain at most 150 characters.")
        if len(email) > 254:
            raise ValueError("Email must contain at most 254 characters.")
    except (ValueError, ValidationError) as error:
        return JsonResponse({"error": str(error)}, status=400)

    if User.objects.filter(username=username).exists():
        return JsonResponse(
            {"userName": username, "error": "Already Registered"}, status=409
        )
    if User.objects.filter(email__iexact=email).exists():
        return JsonResponse(
            {"error": "Email is already registered."}, status=409
        )

    try:
        user = User.objects.create_user(
            username=username,
            password=password,
            first_name=first_name,
            last_name=last_name,
            email=email,
        )
    except IntegrityError:
        return JsonResponse({"error": "Already Registered"}, status=409)

    login(request, user)
    return JsonResponse(
        {"userName": user.username, "status": "Authenticated"}, status=201
    )


# BEGIN CAR INVENTORY VIEW


def get_cars(request):
    if request.method != "GET":
        return JsonResponse({"error": "Use GET to retrieve cars."}, status=405)
    if not CarModel.objects.exists():
        initiate()
    car_models = CarModel.objects.select_related("car_make").order_by("id")
    cars = [
        {"CarModel": model.name, "CarMake": model.car_make.name}
        for model in car_models
    ]
    return JsonResponse({"CarModels": cars})


# BEGIN BACKEND PROXY VIEWS


def proxy_error(error):
    logger.warning("Backend service request failed: %s", error)
    return JsonResponse(
        {
            "status": 502,
            "message": ("A backend service is unavailable. " "Please retry."),
        },
        status=502,
    )


@require_GET
def get_dealerships(request, state="All"):
    endpoint = "/fetchDealers"
    if state != "All":
        endpoint += "/" + quote(state, safe="")
    try:
        dealers = get_request(endpoint)
        return JsonResponse({"status": 200, "dealers": dealers})
    except (requests.RequestException, ValueError) as error:
        return proxy_error(error)


@require_GET
def get_dealer_details(request, dealer_id):
    try:
        dealer = get_request("/fetchDealer/" + str(dealer_id))
        return JsonResponse({"status": 200, "dealer": dealer})
    except requests.HTTPError as error:
        if error.response is not None and error.response.status_code == 404:
            return JsonResponse(
                {"status": 404, "message": "Dealer not found."}, status=404
            )
        return proxy_error(error)
    except (requests.RequestException, ValueError) as error:
        return proxy_error(error)


@require_GET
def get_dealer_reviews(request, dealer_id):
    try:
        reviews = get_request("/fetchReviews/dealer/" + str(dealer_id))
        for review in reviews:
            result = analyze_review_sentiments(review["review"])
            review["sentiment"] = result["sentiment"]
        return JsonResponse({"status": 200, "reviews": reviews})
    except (requests.RequestException, ValueError, KeyError) as error:
        return proxy_error(error)


@csrf_exempt
@require_POST
def add_review(request):
    if not request.user.is_authenticated:
        return JsonResponse(
            {"status": 403, "message": "Unauthorized"}, status=403
        )
    try:
        data = json.loads(request.body)
        if not isinstance(data, dict):
            raise ValueError("Expected a JSON object.")
    except (ValueError, UnicodeDecodeError):
        return JsonResponse(
            {"status": 400, "message": "Invalid JSON review."}, status=400
        )
    try:
        post_review(data)
        return JsonResponse(
            {"status": 200, "message": "Review posted successfully."}
        )
    except (requests.RequestException, ValueError) as error:
        return proxy_error(error)
