let products = [];

let cart =
    JSON.parse(
        localStorage.getItem("ecommerce_cart")
    ) || [];


function showPage(pageId) {

    document
        .querySelectorAll(".page")
        .forEach(page => {
            page.classList.remove("active");
        });

    document
        .getElementById(pageId)
        .classList.add("active");

    if (pageId === "products") {
        loadProducts();
    }

    if (pageId === "cart") {
        displayCart();
    }

    if (pageId === "orders") {
        loadOrders();
    }
}


async function loadProducts() {

    try {

        const response =
            await fetch("/api/products/");

        const data =
            await response.json();

        products =
            data.products;

        displayProducts();

    }

    catch (error) {

        console.error(
            "Product loading error:",
            error
        );

    }
}


function displayProducts() {

    const container =
        document.getElementById(
            "productContainer"
        );

    const search =
        document
            .getElementById("searchInput")
            .value
            .toLowerCase();

    const filteredProducts =
        products.filter(product =>
            product.name
                .toLowerCase()
                .includes(search)
        );

    container.innerHTML = "";

    filteredProducts.forEach(product => {

        const card =
            document.createElement("div");

        card.className =
            "product-card";

        const image =
            product.image ||
            "https://via.placeholder.com/300";

        card.innerHTML = `

            <img
                src="${image}"
                alt="${product.name}"
            >

            <h3>
                ${product.name}
            </h3>

            <p class="price">
                ₹${product.price}
            </p>

            <p>
                Stock: ${product.stock}
            </p>

            <div class="product-buttons">

                <button
                    onclick="viewProduct(${product.id})"
                >
                    Details
                </button>

                <button
                    onclick="addToCart(${product.id})"
                >
                    Add to Cart
                </button>

            </div>
        `;

        container.appendChild(card);

    });

}


async function viewProduct(productId) {

    const response =
        await fetch(
            `/api/products/${productId}/`
        );

    const product =
        await response.json();

    const image =
        product.image ||
        "https://via.placeholder.com/500";

    document.getElementById(
        "productDetails"
    ).innerHTML = `

        <div class="details-card">

            <img
                src="${image}"
                alt="${product.name}"
            >

            <h2>
                ${product.name}
            </h2>

            <p>
                ${product.description}
            </p>

            <p class="price">
                ₹${product.price}
            </p>

            <p>
                Available Stock:
                ${product.stock}
            </p>

            <button
                class="main-button"
                onclick="addToCart(${product.id})"
            >
                Add to Cart
            </button>

        </div>
    `;

    showPage("details");
}


function addToCart(productId) {

    const existingItem =
        cart.find(
            item =>
                item.product_id === productId
        );

    if (existingItem) {

        existingItem.quantity++;

    }

    else {

        cart.push({
            product_id: productId,
            quantity: 1
        });

    }

    saveCart();

    alert(
        "Product added to cart"
    );
}


function saveCart() {

    localStorage.setItem(
        "ecommerce_cart",
        JSON.stringify(cart)
    );

    updateCartCount();
}


function updateCartCount() {

    const count =
        cart.reduce(
            (total, item) =>
                total + item.quantity,
            0
        );

    document.getElementById(
        "cartCount"
    ).textContent = count;
}


function removeFromCart(productId) {

    cart =
        cart.filter(
            item =>
                item.product_id !== productId
        );

    saveCart();

    displayCart();
}


function changeQuantity(
    productId,
    amount
) {

    const item =
        cart.find(
            item =>
                item.product_id === productId
        );

    if (!item) {
        return;
    }

    item.quantity += amount;

    if (item.quantity <= 0) {

        removeFromCart(productId);

        return;
    }

    saveCart();

    displayCart();
}


async function displayCart() {

    if (products.length === 0) {

        await loadProducts();

    }

    const container =
        document.getElementById(
            "cartItems"
        );

    container.innerHTML = "";

    let total = 0;

    if (cart.length === 0) {

        container.innerHTML =
            "<p>Your cart is empty.</p>";

    }

    cart.forEach(item => {

        const product =
            products.find(
                p =>
                    p.id === item.product_id
            );

        if (!product) {
            return;
        }

        total +=
            product.price *
            item.quantity;

        const div =
            document.createElement("div");

        div.className =
            "cart-item";

        div.innerHTML = `

            <div>

                <strong>
                    ${product.name}
                </strong>

                <br>

                ₹${product.price}
                ×
                ${item.quantity}

            </div>

            <div>

                <button
                    onclick="changeQuantity(
                        ${product.id},
                        -1
                    )"
                >
                    -
                </button>

                <button
                    onclick="changeQuantity(
                        ${product.id},
                        1
                    )"
                >
                    +
                </button>

                <button
                    onclick="removeFromCart(
                        ${product.id}
                    )"
                >
                    Remove
                </button>

            </div>
        `;

        container.appendChild(div);

    });

    document.getElementById(
        "cartTotal"
    ).textContent =
        total.toFixed(2);
}


document.getElementById(
    "registerForm"
).addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();

        const username =
            document.getElementById(
                "registerUsername"
            ).value;

        const email =
            document.getElementById(
                "registerEmail"
            ).value;

        const password =
            document.getElementById(
                "registerPassword"
            ).value;

        const response =
            await fetch(
                "/api/register/",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            username,
                            email,
                            password
                        })
                }
            );

        const data =
            await response.json();

        document.getElementById(
            "registerMessage"
        ).textContent =
            data.message ||
            data.error;

        if (response.ok) {

            this.reset();

            checkUser();

        }

    }
);


document.getElementById(
    "loginForm"
).addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();

        const identifier =
            document.getElementById(
                "loginIdentifier"
            ).value;

        const password =
            document.getElementById(
                "loginPassword"
            ).value;

        const response =
            await fetch(
                "/api/login/",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            identifier,
                            password
                        })
                }
            );

        const data =
            await response.json();

        document.getElementById(
            "loginMessage"
        ).textContent =
            data.message ||
            data.error;

        if (response.ok) {

            this.reset();

            checkUser();

            showPage("products");

        }

    }
);


async function logoutUser() {

    await fetch(
        "/api/logout/",
        {
            method: "POST"
        }
    );

    checkUser();

    showPage("home");
}


async function checkUser() {

    const response =
        await fetch(
            "/api/user/"
        );

    const data =
        await response.json();

    const loginButton =
        document.getElementById(
            "loginButton"
        );

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );

    if (data.logged_in) {

        loginButton.textContent =
            data.username;

        logoutButton
            .classList
            .remove("hidden");

    }

    else {

        loginButton.textContent =
            "Login";

        logoutButton
            .classList
            .add("hidden");

    }
}


async function placeOrder() {

    const message =
        document.getElementById(
            "orderMessage"
        );

    if (cart.length === 0) {

        message.textContent =
            "Your cart is empty.";

        return;
    }

    const response =
        await fetch(
            "/api/orders/",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify({
                        items: cart
                    })
            }
        );

    const data =
        await response.json();

    if (response.ok) {

        message.textContent =
            `Order placed successfully.
             Order ID: ${data.order_id}`;

        cart = [];

        saveCart();

        displayCart();

    }

    else {

        message.textContent =
            data.error;

    }
}


async function loadOrders() {

    const container =
        document.getElementById(
            "ordersContainer"
        );

    const response =
        await fetch(
            "/api/orders/"
        );

    const data =
        await response.json();

    if (!response.ok) {

        container.innerHTML =
            `<p>${data.error}</p>`;

        return;
    }

    if (data.orders.length === 0) {

        container.innerHTML =
            "<p>No orders yet.</p>";

        return;
    }

    container.innerHTML = "";

    data.orders.forEach(order => {

        const card =
            document.createElement("div");

        card.className =
            "order-card";

        const items =
            order.items
                .map(
                    item =>
                    `${item.product}
                     × ${item.quantity}`
                )
                .join("<br>");

        card.innerHTML = `

            <h3>
                Order #${order.id}
            </h3>

            <p>
                ${items}
            </p>

            <p>
                <strong>
                    Total:
                    ₹${order.total_price}
                </strong>
            </p>

            <p>
                Status:
                ${order.status}
            </p>

            <p>
                ${order.created_at}
            </p>
        `;

        container.appendChild(card);

    });
}


updateCartCount();

checkUser();

loadProducts();