import { db, storage } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { ref, uploadString, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { getAIResponse } from "./ai.js";

const productList = document.getElementById("productList");

// 🔔 TOAST FUNCTION
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.innerText = message;
  toast.className =
    `fixed bottom-5 right-5 px-6 py-3 rounded-xl shadow-2xl text-white z-50 transform transition-all duration-300 font-semibold flex items-center gap-2 border ` +
    (type === "success" ? "bg-green-500/20 border-green-500/50 backdrop-blur-md text-green-400" : "bg-red-500/20 border-red-500/50 backdrop-blur-md text-red-400");
  toast.classList.remove("hidden");
  setTimeout(() => {
    toast.classList.add("hidden");
  }, 3000);
}

// 📸 IMAGE HANDLING
let currentBase64Image = null;
const imageInput = document.getElementById("productImage");
if (imageInput) {
  imageInput.addEventListener("change", function(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        currentBase64Image = event.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      currentBase64Image = null;
    }
  });
}

// 🤖 AI SCANNER
window.scanImage = async function() {
  const btn = document.getElementById("scanBtn");
  if (!currentBase64Image) {
    showToast("Please select an image first ❌", "error");
    return;
  }
  
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Scanning...';
  btn.disabled = true;

  try {
    const prompt = "Identify the main product in this image and return ONLY its short, concise name. Under 4 words. No other text.";
    const name = await getAIResponse(prompt, currentBase64Image, false);
    document.getElementById("name").value = name.replace(/["']/g, '').trim();
    showToast("Product identified! ✅");
  } catch (error) {
    showToast("AI Scan failed ❌", "error");
    console.error(error);
  }

  btn.innerHTML = '<i class="fas fa-magic"></i> Scan Name';
  btn.disabled = false;
};

// ➕ ADD PRODUCT
window.addProduct = async function () {
  const btn = document.getElementById("addBtn");
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
  btn.disabled = true;

  const name = document.getElementById("name").value;
  const quantity = Number(document.getElementById("quantity").value);
  const costPrice = Number(document.getElementById("costPrice").value);
  const sellingPrice = Number(document.getElementById("sellingPrice").value);

  if (!name || quantity <= 0) {
    showToast("Enter valid product details ❌", "error");
    btn.innerHTML = '<i class="fas fa-plus"></i> Add to Inventory';
    btn.disabled = false;
    return;
  }

  try {
    let imageUrl = null;
    if (currentBase64Image) {
      const imgRef = ref(storage, 'products/' + Date.now() + '_' + name.replace(/\s+/g, '_') + '.jpg');
      await uploadString(imgRef, currentBase64Image, 'data_url');
      imageUrl = await getDownloadURL(imgRef);
    }

    await addDoc(collection(db, "products"), {
      name, quantity, costPrice, sellingPrice, imageUrl
    });

    document.getElementById("name").value = "";
    document.getElementById("quantity").value = "";
    document.getElementById("costPrice").value = "";
    document.getElementById("sellingPrice").value = "";
    if(imageInput) imageInput.value = "";
    currentBase64Image = null;

    showToast("Product added successfully ✅");
    loadProducts();

  } catch (error) {
    console.error(error);
    showToast(error.message, "error");
  }

  btn.innerHTML = '<i class="fas fa-plus"></i> Add to Inventory';
  btn.disabled = false;
};

// 📥 LOAD PRODUCTS
async function loadProducts() {
  productList.innerHTML = "";
  const querySnapshot = await getDocs(collection(db, "products"));

  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const isLow = data.quantity <= 5;
    const lowClass = isLow ? "border border-red-500/50 bg-red-500/10" : "glass-card";

    const div = document.createElement("div");
    div.className = `${lowClass} p-4 rounded-xl flex items-center justify-between gap-4 transition hover:bg-white/5`;

    const imgTag = data.imageUrl 
      ? `<img src="${data.imageUrl}" class="w-14 h-14 object-cover rounded-lg border border-white/10" />`
      : `<div class="w-14 h-14 rounded-lg bg-gray-800 flex items-center justify-center text-gray-500 border border-white/10"><i class="fas fa-box text-xl"></i></div>`;

    div.innerHTML = `
      <div class="flex items-center gap-4">
        ${imgTag}
        <div>
          <h2 class="font-bold text-gray-100">${data.name}</h2>
          <p class="text-sm text-gray-400">Qty: <span class="${isLow ? 'text-red-400 font-bold' : 'text-gray-300'}">${data.quantity}</span> ${isLow ? '⚠️ Low Stock' : ''}</p>
          <p class="text-xs text-gray-500 mt-1">CP: ₹${data.costPrice} | SP: ₹${data.sellingPrice}</p>
        </div>
      </div>
      <button onclick="deleteProduct('${docSnap.id}')"
        class="bg-red-500/20 text-red-500 border border-red-500/30 w-10 h-10 rounded-xl hover:bg-red-500 hover:text-white transition flex items-center justify-center">
        <i class="fas fa-trash"></i>
      </button>
    `;
    productList.appendChild(div);
  });
}

// ❌ DELETE PRODUCT
window.deleteProduct = async function (id) {
  try {
    await deleteDoc(doc(db, "products", id));
    showToast("Product deleted ❌", "error");
    loadProducts();
  } catch (error) {
    console.error(error);
    showToast(error.message, "error");
  }
};

loadProducts();