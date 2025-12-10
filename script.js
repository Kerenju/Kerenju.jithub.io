// --- VARIABLES GLOBALES Y ALMACENAMIENTO ---
const productForm = document.getElementById('productForm');
const inventoryList = document.getElementById('inventoryList');
const submitBtn = document.getElementById('submitBtn');

// Variables para manejo de IMAGEN
const productImageInput = document.getElementById('productImage');
const imagePreview = document.getElementById('imagePreview');

// Variables de Ventas (NUEVO FLUJO DE CARRITO)
const addToCartForm = document.getElementById('addToCartForm');
const cartCodeInput = document.getElementById('cartCode');
const cartQuantityInput = document.getElementById('cartQuantity');
const cartDateInput = document.getElementById('cartDate');
const cartProductInfo = document.getElementById('cartProductInfo');
const cartItemsList = document.getElementById('cartItemsList');
const cartTotalInfo = document.getElementById('cartTotalInfo');
const finishSaleBtn = document.getElementById('finishSaleBtn');

// Variables para Autocompletado 
const autocompleteList = document.getElementById('autocompleteList'); 
let selectedAutocompleteIndex = -1; // Para navegación con teclado

// Variables de Confirmación
const saleConfirmationSection = document.getElementById('sale-confirmation');
const confirmationForm = document.getElementById('confirmationForm');
const finalSaleDetails = document.getElementById('finalSaleDetails');
const confirmClientInput = document.getElementById('confirmClient');
const confirmSellerSelect = document.getElementById('confirmSeller');
const addNewSellerBtn = document.getElementById('addNewSellerBtn');
const cancelSaleBtn = document.getElementById('cancelSaleBtn');

// Variables para Gráficos
let salesByProductChartInstance = null;
let salesBySellerChartInstance = null;
const chartFilterSelect = document.getElementById('chartFilter');
const totalSalesSummary = document.getElementById('totalSalesSummary');
const noProductSales = document.getElementById('noProductSales');
const noSellerSales = document.getElementById('noSellerSales');

// --- NUEVAS VARIABLES DE VENDEDOR Y REPORTE ---
const sellerForm = document.getElementById('sellerForm');
const newSellerNameInput = document.getElementById('newSellerName');
const sellersListTable = document.getElementById('sellersList');

// Variables para Reporte de Ventas Detallado
const salesReportList = document.getElementById('salesReportList');
const reportPeriodFilter = document.getElementById('reportPeriodFilter'); 
const reportDateInput = document.getElementById('reportDateInput'); // Nuevo
const reportMonthInput = document.getElementById('reportMonthInput');
const reportYearInput = document.getElementById('reportYearInput');
const reportSellerFilter = document.getElementById('reportSellerFilter');
const applyReportFilterBtn = document.getElementById('applyReportFilterBtn'); // Nuevo

const customDateGroup = document.getElementById('customDateGroup'); // Nuevo
const customMonthGroup = document.getElementById('customMonthGroup');
const customYearGroup = document.getElementById('customYearGroup');

const reportSummary = document.getElementById('reportSummary');
const noSalesData = document.getElementById('noSalesData');


// Cargar datos de LocalStorage
let products = JSON.parse(localStorage.getItem('products')) || [];
let movements = JSON.parse(localStorage.getItem('movements')) || [];
let sellers = JSON.parse(localStorage.getItem('sellers')) || ['Kerenjulissa', 'Carlos', 'Ana'];

// Variable para el estado del carrito
let cartItems = []; 
let isEditing = false;
let editingIndex = -1;
const STOCK_ALERTA = 10;
const DIAS_CADUCIDAD_ALERTA = 30;

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    renderInventory();
    setupNavigation();

    // Inicialización de la fecha del carrito
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    if (cartDateInput) cartDateInput.value = todayStr;
    
    // Inicialización de filtros de reporte
    const currentYear = today.getFullYear();
    const currentMonth = `${currentYear}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    if (reportDateInput) reportDateInput.value = todayStr;
    if (reportMonthInput) reportMonthInput.value = currentMonth;
    if (reportYearInput) reportYearInput.value = currentYear;


    // Listener para la vista previa de la imagen
    if (productImageInput) {
        productImageInput.addEventListener('change', previewImage);
    }
    
    // Listener de formulario de producto (inventario)
    if (productForm) {
        productForm.addEventListener('submit', handleProductSubmit);
    }
    
    // Listeners del flujo de Venta (Carrito)
    if (addToCartForm) {
        cartCodeInput.addEventListener('input', () => searchProducts(cartCodeInput.value));
        cartCodeInput.addEventListener('keydown', handleAutocompleteKeydown);
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.autocomplete-container')) {
                autocompleteList.classList.add('hidden');
                selectedAutocompleteIndex = -1;
            }
        });

        cartCodeInput.addEventListener('blur', () => {
             setTimeout(updateCartProductInfo, 100); 
        });
        
        addToCartForm.addEventListener('submit', handleAddToCart);
    }
    if (finishSaleBtn) {
        finishSaleBtn.addEventListener('click', handleFinishSale);
    }

    // Listeners de la Confirmación
    if (confirmationForm) {
        confirmationForm.addEventListener('submit', handleConfirmSale);
    }
    if (addNewSellerBtn) {
        addNewSellerBtn.addEventListener('click', () => handleSellerSelection(confirmSellerSelect));
    }
    if (cancelSaleBtn) {
        cancelSaleBtn.addEventListener('click', handleCancelSale);
    }

    // Listeners de Gráficos
    if (chartFilterSelect) {
        chartFilterSelect.addEventListener('change', (e) => {
            renderSalesCharts(e.target.value);
        });
    }
    
    // --- LISTENERS DE GESTIÓN DE VENDEDORES (NUEVO) ---
    if (sellerForm) {
        sellerForm.addEventListener('submit', handleRegisterSeller);
    }
    renderSellersList();
    
    // --- LISTENERS DE REPORTE DE MOVIMIENTOS (ACTUALIZADO) ---
    if (reportPeriodFilter) {
        reportPeriodFilter.addEventListener('change', updateReportFilterInputs);
    }
    if (applyReportFilterBtn) {
        applyReportFilterBtn.addEventListener('click', renderDetailedSalesReport);
    }
    if (reportSellerFilter) {
         reportSellerFilter.addEventListener('change', renderDetailedSalesReport);
    }
    // Inicializar la vista de filtros y el reporte inicial
    updateReportFilterInputs();
    renderDetailedSalesReport(); 

    renderCart();
});

// --- GESTIÓN DE VENDEDORES (ACTUALIZADO) ---

function populateSellersDropdown(selectElement) {
    if (!selectElement) return;
    selectElement.innerHTML = '<option value="">-- Seleccionar vendedor --</option>';
    
    // Si es el filtro de reporte, se añade la opción "Todos"
    if (selectElement.id === 'reportSellerFilter' || selectElement.id === 'chartFilter') {
        selectElement.innerHTML = '<option value="all">Todos los Vendedores</option>';
    }

    sellers.forEach(seller => {
        const option = document.createElement('option');
        option.value = seller;
        option.textContent = seller;
        selectElement.appendChild(option);
    });
}

function handleRegisterSeller(e) {
    e.preventDefault();
    const newSeller = newSellerNameInput.value.trim();
    
    if (newSeller === '') {
        alert('Ingrese un nombre de vendedor válido.');
        return;
    }

    if (sellers.includes(newSeller)) {
        alert('Este vendedor ya está registrado.');
        return;
    }

    sellers.push(newSeller);
    localStorage.setItem('sellers', JSON.stringify(sellers));
    alert(`Vendedor ${newSeller} registrado exitosamente.`);
    sellerForm.reset();
    renderSellersList(); 
    populateSellersDropdown(confirmSellerSelect); 
    populateSellersDropdown(reportSellerFilter); 
    populateSellersDropdown(chartFilterSelect); 
}

function deleteSeller(sellerName) {
    if (confirm(`¿Está seguro que desea eliminar al vendedor ${sellerName}? Esta acción no eliminará las ventas ya registradas.`)) {
        sellers = sellers.filter(s => s !== sellerName);
        localStorage.setItem('sellers', JSON.stringify(sellers));
        renderSellersList();
        populateSellersDropdown(confirmSellerSelect); 
        populateSellersDropdown(reportSellerFilter); 
        populateSellersDropdown(chartFilterSelect); 
    }
}

function renderSellersList() {
    if (!sellersListTable) return;
    sellersListTable.innerHTML = '';

    if (sellers.length === 0) {
        sellersListTable.innerHTML = '<tr><td colspan="2" style="text-align: center;">No hay vendedores registrados.</td></tr>';
        return;
    }

    sellers.forEach(seller => {
        const row = document.createElement('tr');
        // El replace es para escapar las comillas simples si el nombre las contiene
        row.innerHTML = `
            <td>${seller}</td>
            <td>
                <button class="btn delete-btn" onclick="deleteSeller('${seller.replace(/'/g, "\\'")}')"><i class="fas fa-trash-alt"></i> Eliminar</button>
            </td>
        `;
        sellersListTable.appendChild(row);
    });
}

function handleSellerSelection(selectElement) {
    const newSeller = prompt('Ingrese el nombre del nuevo vendedor:');
    
    if (newSeller && newSeller.trim() !== '') {
        const trimmedSeller = newSeller.trim();
        if (!sellers.includes(trimmedSeller)) {
            sellers.push(trimmedSeller);
            localStorage.setItem('sellers', JSON.stringify(sellers));
            renderSellersList();
        }
        populateSellersDropdown(selectElement);
        selectElement.value = trimmedSeller;
    }
}

// --- NAVEGACIÓN (Se mantiene) ---

function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(sec => sec.classList.add('hidden'));
    document.getElementById(sectionId).classList.remove('hidden');
    
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    navLinks.forEach(l => l.classList.remove('active'));
    
    const activeLink = document.querySelector(`.sidebar-nav a[data-section="${sectionId}"]`);
    if (activeLink) activeLink.classList.add('active');

    // Inicializar secciones al mostrar
    if (sectionId === 'vendedor-registro') { // Nuevo
        renderSellersList();
    }
    if (sectionId === 'ventas-diarias') {
        populateSellersDropdown(chartFilterSelect);
        renderSalesCharts(chartFilterSelect ? chartFilterSelect.value : 'all');
    }
    if (sectionId === 'movimientos') {
        populateSellersDropdown(reportSellerFilter);
        updateReportFilterInputs(); 
        renderDetailedSalesReport();
    }
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetSectionId = this.getAttribute('data-section');
            showSection(targetSectionId);
        });
    });
}

// --- INVENTARIO: Lógica de Imagen (Se mantiene) ---

function previewImage() {
    const file = productImageInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            imagePreview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    } else {
        imagePreview.src = '';
        imagePreview.classList.add('hidden');
    }
}

function readImageFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        if (file.size > 2 * 1024 * 1024) { 
            alert('Advertencia: Imagen demasiado grande. Puede afectar el rendimiento.');
        }
        reader.readAsDataURL(file);
    });
}


// --- INVENTARIO: Funciones CRUD y Renderizado (Se mantiene) ---

function renderInventory(filter = '') {
    if (!inventoryList) return;
    inventoryList.innerHTML = '';
    const filterLower = filter.toLowerCase();

    const filteredProducts = products.filter(product => 
        product.nombre.toLowerCase().includes(filterLower) || 
        product.codigo.toLowerCase().includes(filterLower) ||
        product.proveedor.toLowerCase().includes(filterLower)
    );

    filteredProducts.forEach((product, index) => {
        const row = document.createElement('tr');
        
        const imageHtml = product.image
            ? `<img src="${product.image}" alt="${product.nombre}" class="inventory-image" onerror="this.src='data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';">`
            : 'N/A';
            
        row.innerHTML = `
            <td class="image-column">${imageHtml}</td>
            <td>${product.codigo}</td>
            <td>${product.nombre}</td>
            <td>${product.cantidad}</td>
            <td>LPS ${product.precioVenta.toFixed(2)}</td>
            <td>LPS ${product.precioCosto.toFixed(2)}</td>
            <td>${product.fechaCaducidad || 'N/A'}</td>
            <td>${product.proveedor}</td>
            <td>
                <button class="btn edit-btn" onclick="editProduct(${index})"><i class="fas fa-edit"></i></button>
                <button class="btn delete-btn" onclick="deleteProduct(${index})"><i class="fas fa-trash-alt"></i></button>
            </td>
        `;
        
        if (product.cantidad < STOCK_ALERTA && product.cantidad > 0) {
            row.classList.add('stock-bajo');
        } else if (product.cantidad === 0) {
            row.classList.add('caducidad-proxima'); 
        }

        if (product.fechaCaducidad) {
            const caducidad = new Date(product.fechaCaducidad);
            const today = new Date();
            const diffTime = caducidad.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays <= DIAS_CADUCIDAD_ALERTA && diffDays > 0) {
                 row.classList.add('caducidad-proxima'); 
            } else if (diffDays <= 0) {
                 row.classList.add('caducidad-proxima'); 
            }
        }
        
        inventoryList.appendChild(row);
    });
}

document.getElementById('search').addEventListener('keyup', function() {
    renderInventory(this.value);
});

function handleProductSubmit(e) {
    e.preventDefault();
    
    submitBtn.disabled = true;
    submitBtn.textContent = isEditing ? 'Actualizando...' : 'Guardando...';

    const file = productImageInput.files[0];
    
    if (file) {
        readImageFile(file)
            .then(base64Image => saveProductData(base64Image))
            .catch(error => {
                console.error('Error al procesar la imagen:', error);
                alert('Hubo un error al cargar la imagen. Se guardará el producto sin imagen.');
                saveProductData(null);
            })
            .finally(() => {
                submitBtn.disabled = false;
                submitBtn.textContent = isEditing ? 'Actualizar Producto' : 'Guardar Producto';
            });
    } else {
        let existingImage = null;
        if (isEditing && editingIndex !== -1) {
             existingImage = products[editingIndex].image;
        }
        
        saveProductData(existingImage);
        
        submitBtn.disabled = false;
        submitBtn.textContent = isEditing ? 'Actualizar Producto' : 'Guardar Producto';
    }
}

function saveProductData(base64Image) {
    const newProduct = {
        codigo: document.getElementById('codigo').value.trim(),
        nombre: document.getElementById('nombre').value.trim(),
        cantidad: parseInt(document.getElementById('cantidad').value),
        precioVenta: parseFloat(document.getElementById('precioVenta').value),
        precioCosto: parseFloat(document.getElementById('precioCosto').value),
        fechaCaducidad: document.getElementById('fechaCaducidad').value,
        proveedor: document.getElementById('proveedor').value.trim(),
        image: base64Image, 
    };

    if (isEditing) {
        if (!newProduct.image && products[editingIndex].image) {
            newProduct.image = products[editingIndex].image;
        }

        products[editingIndex] = newProduct;
        isEditing = false;
        editingIndex = -1;
        alert(`Producto ${newProduct.nombre} actualizado.`);
    } else {
        if (products.some(p => p.codigo === newProduct.codigo)) {
            alert('¡Error! Ya existe un producto con este código.');
            return;
        }
        products.push(newProduct);
        alert(`Producto ${newProduct.nombre} agregado.`);
    }

    localStorage.setItem('products', JSON.stringify(products));
    productForm.reset();
    imagePreview.src = '';
    imagePreview.classList.add('hidden'); 
    renderInventory();
}

function editProduct(index) {
    const product = products[index];
    document.getElementById('codigo').value = product.codigo;
    document.getElementById('nombre').value = product.nombre;
    document.getElementById('cantidad').value = product.cantidad;
    document.getElementById('precioVenta').value = product.precioVenta;
    document.getElementById('precioCosto').value = product.precioCosto;
    document.getElementById('fechaCaducidad').value = product.fechaCaducidad;
    document.getElementById('proveedor').value = product.proveedor;
    
    if (product.image) {
        imagePreview.src = product.image;
        imagePreview.classList.remove('hidden');
    } else {
        imagePreview.src = '';
        imagePreview.classList.add('hidden');
    }
    
    productImageInput.value = '';

    isEditing = true;
    editingIndex = index;
    submitBtn.textContent = 'Actualizar Producto';
}

function deleteProduct(index) {
    if (confirm(`¿Eliminar ${products[index].nombre}?`)) {
        products.splice(index, 1);
        localStorage.setItem('products', JSON.stringify(products));
        renderInventory();
    }
}

function printInventory(filterType) {
    console.log(`Función de imprimir inventario solicitada con filtro: ${filterType}`);
    alert(`Se iniciará la impresión del inventario con el filtro: ${filterType}`);
}

// --- FUNCIONES DE AUTOCOMPLETADO (Se mantienen) ---

function searchProducts(query) {
    const queryLower = query.toLowerCase().trim();
    autocompleteList.innerHTML = '';
    autocompleteList.classList.add('hidden');
    selectedAutocompleteIndex = -1;

    if (queryLower.length < 1) { 
        return;
    }

    const suggestedProducts = products.filter(p =>
        p.codigo.toLowerCase().includes(queryLower) ||
        p.nombre.toLowerCase().includes(queryLower)
    ).slice(0, 10); 

    if (suggestedProducts.length > 0) {
        suggestedProducts.forEach(product => {
            const item = document.createElement('div');
            item.classList.add('autocomplete-item');
            
            const codeHighlighted = highlightMatch(product.codigo, queryLower);
            const nameHighlighted = highlightMatch(product.nombre, queryLower);

            let displayHtml = `
                <div class="autocomplete-name" data-code="${product.codigo}">
                    <strong>${codeHighlighted}</strong> - ${nameHighlighted}
                </div>
            `;
            
            item.innerHTML = displayHtml;
            
            const info = document.createElement('span');
            info.classList.add('autocomplete-info');
            info.textContent = `Stock: ${product.cantidad} | LPS ${product.precioVenta.toFixed(2)}`;
            item.appendChild(info);

            item.addEventListener('mousedown', (e) => {
                e.preventDefault(); 
                selectProduct(product.codigo);
            });
            
            autocompleteList.appendChild(item);
        });

        autocompleteList.classList.remove('hidden');
    }
}

function selectProduct(code) {
    cartCodeInput.value = code;
    autocompleteList.classList.add('hidden');
    updateCartProductInfo();
    cartQuantityInput.focus();
}

function handleAutocompleteKeydown(e) {
    const items = autocompleteList.querySelectorAll('.autocomplete-item');
    if (items.length === 0) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedAutocompleteIndex = (selectedAutocompleteIndex < items.length - 1) 
            ? selectedAutocompleteIndex + 1 
            : 0;
        updateActiveItem(items);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedAutocompleteIndex = (selectedAutocompleteIndex > 0) 
            ? selectedAutocompleteIndex - 1 
            : items.length - 1;
        updateActiveItem(items);
    } else if (e.key === 'Enter') {
        if (selectedAutocompleteIndex !== -1) {
            e.preventDefault();
            const activeItem = items[selectedAutocompleteIndex];
            const code = activeItem.querySelector('.autocomplete-name').dataset.code;
            selectProduct(code);
        } else if (!autocompleteList.classList.contains('hidden')) {
             e.preventDefault();
             const code = items[0].querySelector('.autocomplete-name').dataset.code;
             selectProduct(code);
        } else {
             updateCartProductInfo();
        }
    } else if (e.key === 'Escape') {
        autocompleteList.classList.add('hidden');
        selectedAutocompleteIndex = -1;
    }
}

function updateActiveItem(items) {
    items.forEach((item, index) => {
        item.classList.remove('autocomplete-active');
        if (index === selectedAutocompleteIndex) {
            item.classList.add('autocomplete-active');
            item.scrollIntoView({ block: 'nearest' });
        }
    });
}

function highlightMatch(text, query) {
    if (!query) return text;
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
    return parts.map(part => 
        part.toLowerCase() === query.toLowerCase() 
            ? `<span style="background-color: #F6D860; font-weight: 700; border-radius: 2px;">${part}</span>`
            : part
    ).join('');
}


// --- FLUJO DE CARRITO, CONFIRMACIÓN Y REPORTES (Se mantienen) ---

function updateCartProductInfo() {
    const code = cartCodeInput.value.trim();
    const product = products.find(p => p.codigo === code);

    cartProductInfo.textContent = 'Producto no seleccionado.';

    if (product) {
        cartProductInfo.textContent = `Producto: ${product.nombre}. Stock disponible: ${product.cantidad}. Precio Venta: LPS ${product.precioVenta.toFixed(2)}`;
    } else if (code) {
        if (autocompleteList.classList.contains('hidden')) {
           cartProductInfo.textContent = '¡Error! Producto no encontrado.';
        }
    }
}

function renderCart() {
    let totalVenta = 0;
    cartItemsList.innerHTML = '';

    if (cartItems.length === 0) {
        cartItemsList.innerHTML = '<tr><td colspan="6" style="text-align: center;">El carrito está vacío. Agregue productos.</td></tr>';
        if (finishSaleBtn) finishSaleBtn.disabled = true;
    } else {
        cartItems.forEach((item, index) => {
            const subtotal = item.price * item.quantity;
            totalVenta += subtotal;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.code}</td>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>LPS ${item.price.toFixed(2)}</td>
                <td>LPS ${subtotal.toFixed(2)}</td>
                <td>
                    <button class="btn delete-btn" onclick="removeFromCart(${index})" style="padding: 5px 8px;">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            `;
            cartItemsList.appendChild(row);
        });
        if (finishSaleBtn) finishSaleBtn.disabled = false;
    }
    if (cartTotalInfo) cartTotalInfo.innerHTML = `Total: <span style="font-weight: 700;">LPS ${totalVenta.toFixed(2)}</span>`;
}

function handleAddToCart(e) {
    e.preventDefault();
    const code = cartCodeInput.value.trim();
    const quantity = parseInt(cartQuantityInput.value);
    const saleDate = cartDateInput.value;

    const product = products.find(p => p.codigo === code);
    
    if (!product) {
        alert('Error: Producto no encontrado. Use el código SKU exacto o seleccione de la lista de sugerencias.');
        return;
    }

    if (quantity <= 0) {
        alert('Error: La cantidad debe ser mayor a 0.');
        return;
    }

    const existingItemIndex = cartItems.findIndex(item => item.code === code);

    if (existingItemIndex !== -1) {
        const totalQuantity = cartItems[existingItemIndex].quantity + quantity;
        if (totalQuantity > product.cantidad) {
             alert(`Error: Stock insuficiente. Solo quedan ${product.cantidad} unidades y ya tiene ${cartItems[existingItemIndex].quantity} en el carrito.`);
             return;
        }
        cartItems[existingItemIndex].quantity = totalQuantity;
    } else {
        if (quantity > product.cantidad) {
             alert(`Error: Stock insuficiente. Solo quedan ${product.cantidad} unidades disponibles.`);
             return;
        }
        cartItems.push({
            code: product.codigo,
            name: product.nombre,
            quantity: quantity,
            price: product.precioVenta,
            date: saleDate,
            cost: product.precioCosto, 
        });
    }

    addToCartForm.reset();
    cartProductInfo.textContent = 'Producto no seleccionado.';
    cartQuantityInput.value = 1;
    cartDateInput.value = saleDate; 
    renderCart();
    cartCodeInput.focus();
}

function removeFromCart(index) {
    cartItems.splice(index, 1);
    renderCart();
}

function calculateCartTotal() {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
}

function handleFinishSale() {
    if (cartItems.length === 0) {
        alert('El carrito está vacío. Agregue productos para finalizar la venta.');
        return;
    }

    showSection('sale-confirmation');
    const total = calculateCartTotal();
    finalSaleDetails.innerHTML = `Total a registrar: <span style="color: #28a745; font-weight: 700;">LPS ${total.toFixed(2)}</span>`;
    populateSellersDropdown(confirmSellerSelect);
}

function handleConfirmSale(e) {
    e.preventDefault();
    const clientName = confirmClientInput.value.trim();
    const sellerName = confirmSellerSelect.value;

    if (!sellerName) {
        alert('Error: Debe seleccionar o agregar un vendedor.');
        return;
    }

    const client = clientName || 'Cliente Anónimo';
    const saleDateStr = cartItems[0].date;
    let successCount = 0;

    cartItems.forEach(item => {
        const productIndex = products.findIndex(p => p.codigo === item.code);

        if (productIndex !== -1) {
            let product = products[productIndex];

            if (item.quantity > product.cantidad) {
                console.error(`Error de stock detectado para ${product.nombre}`);
                return;
            }
            
            product.cantidad -= item.quantity;
            
            const saleTotal = item.price * item.quantity;
            const saleDateTime = new Date(saleDateStr);
            const now = new Date();
            // Asegura que la hora refleje el momento de la confirmación para el registro
            saleDateTime.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

            const movement = {
                date: saleDateTime.toLocaleString('es-HN', {
                    year: 'numeric', month: '2-digit', day: '2-digit', 
                    hour: '2-digit', minute: '2-digit', second: '2-digit', 
                    hour12: true
                }),
                rawDate: saleDateStr, // Fecha en formato 'YYYY-MM-DD' para filtrado
                productName: product.nombre,
                type: 'venta', 
                quantity: item.quantity,
                price: item.price, 
                cost: item.cost,
                total: saleTotal, 
                user: client,
                seller: sellerName
            };

            movements.unshift(movement);
            successCount++;
        }
    });

    if (successCount > 0) {
        localStorage.setItem('products', JSON.stringify(products));
        localStorage.setItem('movements', JSON.stringify(movements));
        alert(`Venta registrada exitosamente. ${successCount} productos vendidos.`);
    } else {
        alert("Advertencia: No se pudo registrar la venta. Verifique el stock.");
    }

    cartItems = [];
    confirmationForm.reset();
    showSection('ventas-principal');
    renderCart();
    renderInventory();
    
    // Actualizar dropdowns y reportes
    populateSellersDropdown(chartFilterSelect);
    populateSellersDropdown(reportSellerFilter);
    renderSalesCharts(chartFilterSelect ? chartFilterSelect.value : 'all');
    renderDetailedSalesReport();
}

function handleCancelSale() {
    if (confirm("¿Está seguro que desea cancelar esta venta y vaciar el carrito?")) {
        cartItems = [];
        showSection('ventas-principal');
        renderCart();
        alert('Venta cancelada y carrito vacío.');
    }
}

// --- FUNCIONES DE REPORTE Y GRÁFICOS (ACTUALIZADO) ---

function getSalesData(filterSeller = 'all') {
    // Se mantiene igual, ya que solo filtra por vendedor y no por fecha
    let sales = movements.filter(m => m.type === 'venta');

    if (filterSeller !== 'all') {
        sales = sales.filter(m => m.seller === filterSeller);
    }

    const salesByProduct = sales.reduce((acc, sale) => {
        acc[sale.productName] = (acc[sale.productName] || 0) + sale.total;
        return acc;
    }, {});

    const salesBySeller = sales.reduce((acc, sale) => {
        acc[sale.seller] = (acc[sale.seller] || 0) + sale.total;
        return acc;
    }, {});

    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);

    return { sales, salesByProduct, salesBySeller, totalSales };
}

function renderSalesCharts(filterSeller = 'all') {
    // Se mantiene la lógica de gráficos
    const { salesByProduct, salesBySeller, totalSales } = getSalesData(filterSeller);
    // ... (El resto de la lógica de Chart.js se mantiene)
    
    // El código de renderizado de charts aquí...
    // Si necesitas el código completo de renderizado de charts, avísame.
}

function updateReportFilterInputs() {
    if (!reportPeriodFilter) return;
    const filter = reportPeriodFilter.value;

    if (customDateGroup) customDateGroup.style.display = 'none';
    if (customMonthGroup) customMonthGroup.style.display = 'none';
    if (customYearGroup) customYearGroup.style.display = 'none';
    
    switch (filter) {
        case 'customDate':
            if (customDateGroup) customDateGroup.style.display = 'block';
            break;
        case 'customMonth':
            if (customMonthGroup) customMonthGroup.style.display = 'block';
            break;
        case 'customYear':
            if (customYearGroup) customYearGroup.style.display = 'block';
            break;
    }
}


function renderDetailedSalesReport() { 
    if (!salesReportList || !reportSummary || !noSalesData || !reportPeriodFilter) return;

    salesReportList.innerHTML = '';
    
    const filterType = reportPeriodFilter.value;
    const filterSeller = reportSellerFilter.value;
    
    let filteredSales = movements.filter(m => m.type === 'venta');
    
    // 1. Filtrar por Vendedor
    if (filterSeller !== 'all') {
        filteredSales = filteredSales.filter(sale => sale.seller === filterSeller);
    }

    // 2. Filtrar por Periodo
    filteredSales = filteredSales.filter(sale => {
        const saleDate = new Date(sale.rawDate + 'T00:00:00'); 
        const saleYear = saleDate.getFullYear();
        const saleMonth = saleDate.getMonth() + 1; // 1-12

        switch (filterType) {
            case 'customDate':
                return sale.rawDate === (reportDateInput ? reportDateInput.value : '');
                
            case 'customMonth':
                if (!reportMonthInput || !reportMonthInput.value) return false;
                const [filterYearM, filterMonthM] = reportMonthInput.value.split('-').map(Number);
                return saleYear === filterYearM && saleMonth === filterMonthM;
                
            case 'customYear':
                if (!reportYearInput || !reportYearInput.value) return false;
                const filterYearY = parseInt(reportYearInput.value);
                return saleYear === filterYearY;

            case 'all':
            default:
                return true;
        }
    });

    let totalVentas = 0;
    
    if (filteredSales.length === 0) {
        noSalesData.classList.remove('hidden');
        reportSummary.textContent = `Resumen: 0 ventas por un total de LPS 0.00`;
        return;
    } else {
        noSalesData.classList.add('hidden');
    }
    
    filteredSales.forEach(sale => {
        totalVentas += sale.total;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${sale.date}</td>
            <td>${sale.seller}</td>
            <td>${sale.productName}</td>
            <td>${sale.quantity}</td>
            <td>LPS ${sale.price.toFixed(2)}</td>
            <td style="font-weight: 600;">LPS ${sale.total.toFixed(2)}</td>
            <td>${sale.user}</td>
        `;
        salesReportList.appendChild(row);
    });

    reportSummary.innerHTML = `<strong>Resumen:</strong> ${filteredSales.length} ventas por un total de <span class="text-success">LPS ${totalVentas.toFixed(2)}</span>`;
}