from django.urls import path
from django.conf.urls.static import static
from django.conf import settings
from . import views

app_name = "djangoapp"
urlpatterns = [
    path("login", views.login_user, name="login"),
    path("logout", views.logout_request, name="logout"),
    path("register", views.registration, name="register"),
    path("session", views.session_user, name="session"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
