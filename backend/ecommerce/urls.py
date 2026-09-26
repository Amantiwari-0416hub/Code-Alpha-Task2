from django.contrib import admin
from django.urls import path

from store import views


urlpatterns = [

    path(
        "admin/",
        admin.site.urls
    ),

    path(
        "",
        views.home,
        name="home"
    ),

    path(
        "api/products/",
        views.products,
        name="products"
    ),

    path(
        "api/products/<int:product_id>/",
        views.product_detail,
        name="product_detail"
    ),

    path(
        "api/register/",
        views.register_user,
        name="register"
    ),

    path(
        "api/login/",
        views.login_user,
        name="login"
    ),

    path(
        "api/logout/",
        views.logout_user,
        name="logout"
    ),

    path(
        "api/user/",
        views.current_user,
        name="current_user"
    ),

    path(
        "api/orders/",
        views.orders,
        name="orders"
    ),
]