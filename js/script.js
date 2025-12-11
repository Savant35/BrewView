
//--========================================== Selectors =================================
const coffeeType = document.querySelectorAll(".coffee-type-item");
const cardPopup = document.querySelector(".pop-up"); 
const closePopup = document.getElementById("close-popup");
const sizes = document.querySelectorAll(".size-item");

//keeps product data that has been loaded already
let allProducts = [];
let activeProduct = null; // Stores the currently open product
//--========================================== AppWrite Setup =================================
const { Client, Databases, Query, Storage } = Appwrite;
const client = new Client()
    .setEndpoint("https://appwrite.aliarthur.com/v1")
    .setProject("6935e6db000953c70659");

const storage = new Storage(client);
const databases = new Databases(client);

//--========================================== Helper Functions =================================


window.addEventListener("click", function(event) {

    // 1. Check if the popup is actually open right now
    const isOpen = cardPopup.classList.contains("active-detailed");

    const isInsidePopup = cardPopup.contains(event.target);

    //  Check if the user clicked a Coffee Card (the trigger)
    const isTrigger = event.target.closest(".coffee-card");

    // If it is Open, AND the click was NOT inside, AND the click was NOT on a trigger
    if (isOpen && !isInsidePopup && !isTrigger) {
        handleClosePopup(event);
    }
});

// 1. Generate Image URL
function generateImageUrl(fileId) {
    const bucketId = "693620eb0022a4a6f36d";
    return storage.getFilePreview(bucketId, fileId);
}

// 2. Create Product Card HTML
function createProductCard(product) {
    const coffeeCard = document.createElement("div");
    coffeeCard.classList.add("coffee-card");
    //Attach the unique ID to the card so we know which one is clicked
    coffeeCard.setAttribute("data-id", product.$id);


    const card = `
    <div class="image-wrapper">
        <img src="${generateImageUrl(product.image_id)}" alt="${product.name}">
        <span class="rating">
            <i class="fa-solid fa-star"></i>
            <p>${product.rating_average}</p>
        </span>
    </div>

    <div class="card-content">
        <p class="coffee-name">${product.name}</p>
        <p class="coffee-subheading">${product.subheading}</p>

        <div class="card-footer">
            <p class="price">$ ${product.base_price}</p>
            <div class="add-button">
                <i class="fa-solid fa-plus"></i>
            </div>
        </div>
    </div>
    `;

    coffeeCard.innerHTML = card;
    document.getElementById("card-container").appendChild(coffeeCard);
}

// 3. Update Popup Content
function updatePopupContent(product) {
    const popupImg = document.querySelector("#image-container img");
    if(popupImg) popupImg.src = generateImageUrl(product.image_id);

    const titleEl = document.getElementById("footer-title");
    if(titleEl) titleEl.textContent = product.name;

    const subEl = document.getElementById("footer-sub");
    if(subEl) subEl.textContent = product.subheading;

    const ratingEl = document.querySelector("#footer-rating p");
    if(ratingEl) ratingEl.textContent = `${product.rating_average} (${product.rating_count} Reviews)`;

    const descEl = document.querySelector(".description-text");
    if(descEl) descEl.textContent = product.description || "No description available for this item.";

    const priceEl = document.querySelector("#final-price span p:nth-child(2)");
    if(priceEl) priceEl.textContent = `$ ${product.base_price}`;
}

// 3. Attach Click Listeners to Dynamic Cards
function attachCardListeners() {
    const currentCards = document.querySelectorAll(".coffee-card");
    currentCards.forEach(card => {
        card.addEventListener("click", handleCardClick);
    });
}

//--========================================== Main Logic =================================

// 4. Load Products (Now with Filtering!)
async function loadProducts(selectedCategory = null) {
    try {
        //Clear the container so we don't stack new cards on old ones
        document.getElementById("card-container").innerHTML = "";

        //Define base queries (Sort & Limit)
        let queries = [
            Appwrite.Query.limit(25),
            Appwrite.Query.orderAsc('name')
        ];

        //reset all cards and Apply Filter if a category is selected
        if (selectedCategory && selectedCategory !== "All") {
            // Note: Ensure your Appwrite attribute is named "category"
            queries.push(Appwrite.Query.equal("category", selectedCategory));
        }

        // D. Fetch from Appwrite
        const response = await databases.listDocuments(
            "6935f10100052c5dcdb1", // Database ID
            "products",             // Collection ID
            queries                 // Pass our dynamic queries
        );

        allProducts = response.documents;

        // E. Generate Cards
        const productList = response.documents;
        productList.forEach((product) => {
            createProductCard(product);
        });

        //Re-attach event listeners to the new cards
        attachCardListeners();

    } catch (error) {
        console.error("Failed to load products:", error);
    }
}

//--========================================== Event Handlers =================================

// Handle Category Button Clicks
function handleCoffeeType(event) {
    event.preventDefault();
    const clickedItem = event.currentTarget;

    // Don't do anything if already active
    if (clickedItem.classList.contains("active-indicator")) {
        return;
    }

    // Switch the active class
    coffeeType.forEach(item => item.classList.remove("active-indicator"));
    clickedItem.classList.add("active-indicator");

    // Logic: Get the category name and fetch data
    const categoryName = clickedItem.innerText.trim();
    //console.log("Filtering by:", categoryName);
    
    loadProducts(categoryName);
}

// Handle Card Clicks (Popup Open)
function handleCardClick(event) {
    event.preventDefault();
    const clickedCard = event.currentTarget;

    //Get the ID from the clicked card
    const productId = clickedCard.getAttribute("data-id");

    // Find the correct product object in our global array
    const productData = allProducts.find(p => p.$id === productId);

    // Inject data into the popup
    if (productData) {
        activeProduct = productData;
        updatePopupContent(productData);
    }

    // Note: Your HTML uses 'pop-up' ID. Assuming you have CSS to show it.
    cardPopup.classList.add("active-detailed"); 
}

// Handle Popup Close
function handleClosePopup(event) {
    event.preventDefault();
 
    if (!cardPopup.classList.contains("active-detailed")) {
        return;
    }

    cardPopup.classList.remove("active-detailed");

    const allCards = document.querySelectorAll(".coffee-card");
    allCards.forEach(card => {
        card.classList.remove("active-card");
    });
}

//handles price changes when different size is chosen
function handleSizeChange(event) {
    event.preventDefault();
    const clickedItem = event.currentTarget;

    if (clickedItem.classList.contains("active-size")) return;

    // 2. Visual: Update the buttons (Remove active from all, add to clicked)
    sizes.forEach(size => size.classList.remove("active-size"));
    clickedItem.classList.add("active-size");

    const selectedSize = clickedItem.textContent.trim(); // e.g., "Medium" or "Small"

    //Start with the default base price (Matches "Small")
    let newPrice = parseFloat(activeProduct.base_price);

    // Check if there is a special price list for this product
    if (activeProduct.size_prices) {
        try {
            // Appwrite sometimes returns this as a JSON string, sometimes as an Object.
            // This line handles both cases safely.
            const priceList = typeof activeProduct.size_prices === 'string' 
                ? JSON.parse(activeProduct.size_prices) 
                : activeProduct.size_prices;

            // Search the list for the size we just clicked
            const foundOption = priceList.find(item => item.size === selectedSize);
            
            // If we found a specific price for this size, use it!
            if (foundOption) {
                newPrice = parseFloat(foundOption.price);
            }
        } catch (error) {
            console.error("Error reading price list:", error);
        }
    }

    const priceElement = document.querySelector("#final-price span p:nth-child(2)");
    if (priceElement) {
        priceElement.textContent = `$ ${newPrice.toFixed(2)}`;
    }
}
//--========================================== Attach Event listeners =================================

closePopup.addEventListener("click", handleClosePopup);
sizes.forEach(item => {
  item.addEventListener("click", handleSizeChange);
})

coffeeType.forEach(item => {
    item.addEventListener("click", handleCoffeeType);
});

// Load initial data
loadProducts();
