
//--========================================== Selectors =================================
const coffeeType = document.querySelectorAll(".coffee-type-item");
const cardPopup = document.querySelector(".pop-up"); 
const closePopup = document.getElementById("close-popup");

let allProducts = [];

//--========================================== AppWrite Setup =================================
const { Client, Databases, Query, Storage } = Appwrite;
const client = new Client()
    .setEndpoint("https://appwrite.aliarthur.com/v1")
    .setProject("6935e6db000953c70659");

const storage = new Storage(client);
const databases = new Databases(client);

//--========================================== Helper Functions =================================

// 1. Generate Image URL
function generateImageUrl(fileId) {
    const bucketId = "693620eb0022a4a6f36d";
    return storage.getFilePreview(bucketId, fileId);
}

// 2. Create Product Card HTML
function createProductCard(product) {
    const coffeeCard = document.createElement("div");
    coffeeCard.classList.add("coffee-card");


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
    console.log("Filtering by:", categoryName);
    
    loadProducts(categoryName);
}

// Handle Card Clicks (Popup Open)
function handleCardClick(event) {
    event.preventDefault();
    const clickedCard = event.currentTarget;

    if (clickedCard.classList.contains("active-card")) {
        return;
    }

    // Remove active class from any other card
    const allCards = document.querySelectorAll(".coffee-card");
    allCards.forEach(card => card.classList.remove("active-card"));

    clickedCard.classList.add("active-card"); 
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

//--========================================== Initialization =================================

// Attach listeners to static elements
closePopup.addEventListener("click", handleClosePopup);

coffeeType.forEach(item => {
    item.addEventListener("click", handleCoffeeType);
});

// Load initial data
loadProducts();
