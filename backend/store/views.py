import json

from django.contrib.auth import authenticate
from django.contrib.auth import login as django_login
from django.contrib.auth import logout as django_logout
from django.contrib.auth.models import User

from django.db import transaction
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt

from .models import Product, Order, OrderItem


def home(request):
    return render(request, "index.html")


def products(request):

    if request.method != "GET":
        return JsonResponse(
            {"error": "GET request required"},
            status=405
        )

    products_data = []

    for product in Product.objects.all():

        products_data.append({
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "price": float(product.price),
            "image": product.image,
            "stock": product.stock
        })

    return JsonResponse(
        {"products": products_data}
    )


def product_detail(request, product_id):

    try:
        product = Product.objects.get(id=product_id)

    except Product.DoesNotExist:
        return JsonResponse(
            {"error": "Product not found"},
            status=404
        )

    return JsonResponse({
        "id": product.id,
        "name": product.name,
        "description": product.description,
        "price": float(product.price),
        "image": product.image,
        "stock": product.stock
    })


@csrf_exempt
def register_user(request):

    if request.method != "POST":
        return JsonResponse(
            {"error": "POST request required"},
            status=405
        )

    try:
        data = json.loads(request.body)

        username = data.get("username", "").strip()
        email = data.get("email", "").strip()
        password = data.get("password", "")

        if not username or not email or not password:
            return JsonResponse(
                {"error": "All fields are required"},
                status=400
            )

        if User.objects.filter(username=username).exists():
            return JsonResponse(
                {"error": "Username already exists"},
                status=400
            )

        if User.objects.filter(email=email).exists():
            return JsonResponse(
                {"error": "Email already registered"},
                status=400
            )

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )

        django_login(request, user)

        return JsonResponse({
            "message": "Registration successful",
            "username": user.username
        })

    except json.JSONDecodeError:

        return JsonResponse(
            {"error": "Invalid JSON"},
            status=400
        )


@csrf_exempt
def login_user(request):

    if request.method != "POST":
        return JsonResponse(
            {"error": "POST request required"},
            status=405
        )

    try:
        data = json.loads(request.body)

        identifier = data.get("identifier", "").strip()
        password = data.get("password", "")

        username = identifier

        if "@" in identifier:

            try:
                user_object = User.objects.get(email=identifier)
                username = user_object.username

            except User.DoesNotExist:
                return JsonResponse(
                    {"error": "Invalid email or password"},
                    status=401
                )

        user = authenticate(
            request,
            username=username,
            password=password
        )

        if user is None:
            return JsonResponse(
                {"error": "Invalid username/email or password"},
                status=401
            )

        django_login(request, user)

        return JsonResponse({
            "message": "Login successful",
            "username": user.username
        })

    except json.JSONDecodeError:

        return JsonResponse(
            {"error": "Invalid JSON"},
            status=400
        )


@csrf_exempt
def logout_user(request):

    if request.method != "POST":
        return JsonResponse(
            {"error": "POST request required"},
            status=405
        )

    django_logout(request)

    return JsonResponse({
        "message": "Logout successful"
    })


def current_user(request):

    if request.user.is_authenticated:

        return JsonResponse({
            "logged_in": True,
            "username": request.user.username,
            "email": request.user.email
        })

    return JsonResponse({
        "logged_in": False
    })


@csrf_exempt
@transaction.atomic
def orders(request):

    if not request.user.is_authenticated:
        return JsonResponse(
            {"error": "Please login first"},
            status=401
        )

    if request.method == "GET":

        order_list = []

        for order in request.user.orders.all().order_by("-created_at"):

            items = []

            for item in order.items.all():

                items.append({
                    "product": item.product.name,
                    "quantity": item.quantity,
                    "price": float(item.price)
                })

            order_list.append({
                "id": order.id,
                "total_price": float(order.total_price),
                "status": order.status,
                "created_at": order.created_at.strftime(
                    "%d-%m-%Y %H:%M"
                ),
                "items": items
            })

        return JsonResponse({
            "orders": order_list
        })

    if request.method == "POST":

        try:
            data = json.loads(request.body)

            cart_items = data.get("items", [])

            if not cart_items:
                return JsonResponse(
                    {"error": "Cart is empty"},
                    status=400
                )

            validated_items = []
            total = 0

            for item in cart_items:

                product_id = item.get("product_id")
                quantity = int(item.get("quantity", 1))

                if quantity <= 0:
                    return JsonResponse(
                        {"error": "Invalid quantity"},
                        status=400
                    )

                try:
                    product = Product.objects.get(
                        id=product_id
                    )

                except Product.DoesNotExist:

                    return JsonResponse(
                        {"error": "Product not found"},
                        status=404
                    )

                if product.stock < quantity:

                    return JsonResponse(
                        {
                            "error":
                            f"Not enough stock for {product.name}"
                        },
                        status=400
                    )

                total += product.price * quantity

                validated_items.append(
                    (product, quantity)
                )

            order = Order.objects.create(
                user=request.user,
                total_price=total
            )

            for product, quantity in validated_items:

                OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=quantity,
                    price=product.price
                )

                product.stock -= quantity
                product.save()

            return JsonResponse({
                "message": "Order placed successfully",
                "order_id": order.id,
                "total": float(total)
            })

        except (json.JSONDecodeError, ValueError):

            return JsonResponse(
                {"error": "Invalid data"},
                status=400
            )

    return JsonResponse(
        {"error": "Invalid request"},
        status=405
    )