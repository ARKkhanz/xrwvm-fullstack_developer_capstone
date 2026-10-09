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
        return JsonResponse({"error": "Email is already registered."}, status=409)

    try:
        user = User.objects.create_user(
            username=username, password=password,
            first_name=first_name, last_name=last_name, email=email,
        )
    except IntegrityError:
        return JsonResponse({"error": "Already Registered"}, status=409)

    login(request, user)
    return JsonResponse(
        {"userName": user.username, "status": "Authenticated"}, status=201
    )
