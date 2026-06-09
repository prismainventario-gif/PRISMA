/* app.js - versión con precio unitario e importe */

// Elementos DOM
let lista = document.getElementById("lista");
let formulario = document.getElementById("formulario");
let buscar = document.getElementById("buscar");
let total = document.getElementById("total");

let tablaNota = document.getElementById("tablaNota");
let selectProducto = document.getElementById("productoNota");

// Datos persistentes
let productos = JSON.parse(localStorage.getItem("productos")) || [];
let movimientos = JSON.parse(localStorage.getItem("movimientos")) || [];
let nota = [];

let editando = false;
let indexEditar = null;

/* ---------- Funciones auxiliares ---------- */

function calcularTotal(p) {
    return (p.stockInicial || 0) + (p.entrada || 0) - (p.salida || 0);
}

function guardarProductos() {
    localStorage.setItem("productos", JSON.stringify(productos));
    mostrarProductos();
}

function guardarMovimientos() {
    localStorage.setItem("movimientos", JSON.stringify(movimientos));
}

/* Registrar movimiento */
function registrarMovimiento({
    codigo = "",
    producto = "",
    fecha = null,
    tipo = "",
    cantidad = 0,
    usuario = "",
    comentario = ""
}) {

    const m = {
        codigo,
        producto,
        fecha: fecha || new Date().toISOString().slice(0,10),
        tipo,
        cantidad,
        usuario,
        comentario
    };

    movimientos.push(m);

    guardarMovimientos();
}

/* ---------- Inicialización ---------- */

mostrarProductos();

/* ---------- Formulario ---------- */

formulario.addEventListener("submit", function(e) {

    e.preventDefault();

    let producto = {

        nombre: document.getElementById("nombre").value,

        descripcion: document.getElementById("descripcion").value,

        proveedor: document.getElementById("proveedor").value,

        unidad: document.getElementById("unidad").value,

        stockInicial: parseInt(document.getElementById("stockInicial").value) || 0,

        entrada: parseInt(document.getElementById("entrada").value) || 0,

        salida: parseInt(document.getElementById("salida").value) || 0,

        precio: parseFloat(document.getElementById("precio").value) || 0
    };

    if (editando) {

        let previo = productos[indexEditar] || {};

        let diffEntrada = (producto.entrada || 0) - (previo.entrada || 0);
        let diffSalida = (producto.salida || 0) - (previo.salida || 0);
        let diffStockInicial = (producto.stockInicial || 0) - (previo.stockInicial || 0);

        productos[indexEditar] = producto;

        editando = false;

        if (diffStockInicial > 0) {

            registrarMovimiento({
                codigo: "",
                producto: producto.nombre,
                tipo: "Alta",
                cantidad: diffStockInicial,
                usuario: "",
                comentario: "Ajuste stock inicial (edición)"
            });
        }

        if (diffEntrada > 0) {

            registrarMovimiento({
                codigo: "",
                producto: producto.nombre,
                tipo: "Entrada",
                cantidad: diffEntrada,
                usuario: "",
                comentario: "Entrada (edición)"
            });
        }

        if (diffSalida > 0) {

            registrarMovimiento({
                codigo: "",
                producto: producto.nombre,
                tipo: "Salida",
                cantidad: diffSalida,
                usuario: "",
                comentario: "Salida (edición)"
            });
        }

    } else {

        productos.push(producto);

        if ((producto.stockInicial || 0) > 0) {

            registrarMovimiento({
                codigo: "",
                producto: producto.nombre,
                tipo: "Alta",
                cantidad: producto.stockInicial,
                usuario: "",
                comentario: "Alta inicial"
            });
        }

        if ((producto.entrada || 0) > 0) {

            registrarMovimiento({
                codigo: "",
                producto: producto.nombre,
                tipo: "Entrada",
                cantidad: producto.entrada,
                usuario: "",
                comentario: "Entrada inicial"
            });
        }

        if ((producto.salida || 0) > 0) {

            registrarMovimiento({
                codigo: "",
                producto: producto.nombre,
                tipo: "Salida",
                cantidad: producto.salida,
                usuario: "",
                comentario: "Salida inicial"
            });
        }
    }

    guardarProductos();

    formulario.reset();

    document.getElementById("precio").value = "";
});

/* ---------- Mostrar Productos ---------- */

function mostrarProductos(listaProductos = productos) {

    lista.innerHTML = "";

    listaProductos.forEach((producto, index) => {

        let totalCalc = calcularTotal(producto);

        let importe = totalCalc * (producto.precio || 0);

        lista.innerHTML += `
        <tr>

            <td>${index + 1}</td>

            <td>${producto.nombre}</td>

            <td>${producto.descripcion || ""}</td>

            <td>${producto.proveedor || ""}</td>

            <td>${producto.unidad}</td>

            <td>${producto.stockInicial}</td>

            <td>${producto.entrada}</td>

            <td>${producto.salida}</td>

            <td>${totalCalc}</td>

            <td>$${(producto.precio || 0).toFixed(2)}</td>

            <td>$${importe.toFixed(2)}</td>

            <td>
                <button class="editar" onclick="editar(${index})">
                    Editar
                </button>

                <button class="eliminar" onclick="eliminar(${index})">
                    Eliminar
                </button>
            </td>

        </tr>`;
    });

    total.textContent = productos.length;

    cargarSelect();
}

/* ---------- Eliminar ---------- */

function eliminar(index) {

    productos.splice(index, 1);

    guardarProductos();
}

/* ---------- Editar ---------- */

function editar(index) {

    let p = productos[index];

    document.getElementById("nombre").value = p.nombre;

    document.getElementById("descripcion").value = p.descripcion;

    document.getElementById("proveedor").value = p.proveedor;

    document.getElementById("unidad").value = p.unidad;

    document.getElementById("stockInicial").value = p.stockInicial;

    document.getElementById("entrada").value = p.entrada;

    document.getElementById("salida").value = p.salida;

    document.getElementById("precio").value = p.precio || 0;

    editando = true;

    indexEditar = index;
}

/* ---------- Buscar ---------- */

buscar.addEventListener("keyup", function() {

    let texto = buscar.value.toLowerCase();

    let filtrados = productos.filter(p =>
        p.nombre.toLowerCase().includes(texto)
    );

    mostrarProductos(filtrados);
});

/* ---------- Select ---------- */

function cargarSelect() {

    selectProducto.innerHTML = "";

    productos.forEach((p, index) => {

        selectProducto.innerHTML += `
        <option value="${index}">
            ${p.nombre}
        </option>`;
    });
}

/* ---------- Nota ---------- */

/* ---------- Agregar Nota y Descontar Inventario ---------- */

function agregarNota() {

    let index = selectProducto.value;

    let cantidad =
        parseInt(document.getElementById("cantidadNota").value);

    let codigo =
        document.getElementById("codigoProducto").value;

    let precioUnitario =
        parseFloat(
            document.getElementById("precioUnitario").value
        ) || 0;

    if (!cantidad || cantidad <= 0) {

        alert("Cantidad inválida");

        return;
    }

    let producto = productos[index];

    // Stock actual
    let stockActual = calcularTotal(producto);

    if (stockActual < cantidad) {

        alert("No hay suficiente stock");

        return;
    }

    // Agregar a nota
    nota.push({

        nombre: producto.nombre,

        codigo: codigo,

        cantidad: cantidad,

        precioUnitario: precioUnitario,

        importe: cantidad * precioUnitario
    });

    // DESCONTAR DEL INVENTARIO
    producto.salida =
        (producto.salida || 0) + cantidad;

    // Registrar movimiento
    registrarMovimiento({

        codigo: codigo,

        producto: producto.nombre,

        tipo: "Salida",

        cantidad: cantidad,

        usuario: document.getElementById("persona").value || "",

        comentario: "Salida por nota de entrega"
    });

    // Guardar cambios
    guardarProductos();

    // Limpiar campos
    document.getElementById("codigoProducto").value = "";

    document.getElementById("precioUnitario").value = "";

    document.getElementById("cantidadNota").value = "";

    // Actualizar tablas
    mostrarNota();

    mostrarProductos();

    alert("Producto agregado y descontado del inventario");
}

/* ---------- Mostrar Nota ---------- */

function mostrarNota() {

    tablaNota.innerHTML = "";

    nota.forEach(n => {

        tablaNota.innerHTML += `
        <tr>

            <td>${n.codigo}</td>

            <td>${n.nombre}</td>

            <td>${n.cantidad}</td>

            <td>$${n.precioUnitario.toFixed(2)}</td>

            <td>$${n.importe.toFixed(2)}</td>

        </tr>`;
    });
}

/* ---------- Exportar Inventario ---------- */

function exportarExcel() {

    let datos = productos.map((p, i) => ({

        No: i + 1,

        Producto: p.nombre,

        Descripcion: p.descripcion,

        Proveedor: p.proveedor,

        Unidad: p.unidad,

        Stock: calcularTotal(p),

        Precio_Unitario: `$${(p.precio || 0).toFixed(2)}`,

        Importe: `$${(calcularTotal(p) * (p.precio || 0)).toFixed(2)}`
    }));

    let hoja = XLSX.utils.json_to_sheet(datos);

    let libro = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(libro, hoja, "Inventario");

    XLSX.writeFile(libro, "Inventario.xlsx");
}

/* ---------- Descargar Nota Excel ---------- */

/* ---------- CARGAR IMÁGENES ---------- */

function cargarImagen(url) {

    return new Promise((resolve, reject) => {

        const xhr = new XMLHttpRequest();

        xhr.open("GET", url, true);

        xhr.responseType = "blob";

        xhr.onload = function () {

            if (this.status === 200) {

                const reader = new FileReader();

                reader.onload = function () {

                    resolve(reader.result);
                };

                reader.readAsDataURL(this.response);

            } else {

                reject("Error cargando imagen");
            }
        };

        xhr.onerror = function () {

            reject("No se pudo cargar la imagen");
        };

        xhr.send();
    });
}

/* ---------- GENERAR NOTA EXCEL PROFESIONAL ---------- */

async function generarExcelNota() {

    if (nota.length === 0) {

        alert("No hay productos en la nota");

        return;
    }

    let persona = document.getElementById("persona").value;

    if (!persona) {

        alert("Escribe el nombre de quien recibe");

        return;
    }

    const workbook = new ExcelJS.Workbook();

    const worksheet = workbook.addWorksheet("NOTA");

    worksheet.pageSetup.orientation = 'landscape';

    worksheet.columns = [
        { width: 15 },
        { width: 25 },
        { width: 30 },
        { width: 15 },
        { width: 15 },
        { width: 18 },
        { width: 18 }
    ];

    /* ---------- LOGOS ---------- */

    try {

        const logo1 =
            await cargarImagen("img/logo1.png");

        const img1 = workbook.addImage({
            base64: logo1,
            extension: 'png'
        });

        worksheet.addImage(img1, {
            tl: { col: 0.2, row: 0.2 },
            ext: { width: 80, height: 60 }
        });

    } catch (e) {

        console.log("Logo 1 no disponible");
    }

    try {

        const logo2 =
            await cargarImagen("img/logo2.png");

        const img2 = workbook.addImage({
            base64: logo2,
            extension: 'png'
        });

        worksheet.addImage(img2, {
            tl: { col: 2.3, row: 0.1 },
            ext: { width: 250, height: 80 }
        });

    } catch (e) {

        console.log("Logo 2 no disponible");
    }

    try {

        const logo3 =
            await cargarImagen("img/logo3.png");

        const img3 = workbook.addImage({
            base64: logo3,
            extension: 'png'
        });

        worksheet.addImage(img3, {
            tl: { col: 6.2, row: 0.2 },
            ext: { width: 80, height: 60 }
        });

    } catch (e) {

        console.log("Logo 3 no disponible");
    }

    /* ---------- TÍTULO ---------- */

    worksheet.mergeCells('A6:G6');

    worksheet.getCell('A6').value =
        "NOTA DE ENTREGA";

    worksheet.getCell('A6').font = {
        size: 16,
        bold: true,
        color: { argb: "FFFFFFFF" }
    };

    worksheet.getCell('A6').alignment = {
        horizontal: 'center'
    };

    worksheet.getCell('A6').fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "C00000" }
    };

    /* ---------- SUBTÍTULO ---------- */

    worksheet.mergeCells('A7:G7');

    worksheet.getCell('A7').value =
        "Comprobante de Entrega de Material";

    worksheet.getCell('A7').alignment = {
        horizontal: 'center'
    };

    worksheet.getCell('A7').font = {
        italic: true
    };

    /* ---------- RESPONSABLE ---------- */

    worksheet.mergeCells('A9:C9');

    worksheet.getCell('A9').value =
        "INFORMACIÓN DEL RESPONSABLE";

    worksheet.getCell('A9').font = {
        bold: true,
        color: { argb: "FFFFFFFF" }
    };

    worksheet.getCell('A9').fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "C00000" }
    };

    worksheet.mergeCells('E9:G9');

    worksheet.getCell('E9').value =
        "INFORMACIÓN DEL QUE RECIBE";

    worksheet.getCell('E9').font = {
        bold: true,
        color: { argb: "FFFFFFFF" }
    };

    worksheet.getCell('E9').fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "C00000" }
    };

    /* ---------- DATOS ---------- */

    let responsableTitular =
        document.getElementById("responsableTitular").value;

    let responsableArea =
        document.getElementById("responsableArea").value;

    let responsableTelefono =
        document.getElementById("responsableTelefono").value;

    let responsableEmail =
        document.getElementById("responsableEmail").value;

    let areaRecibe =
        document.getElementById("areaRecibe").value;

    let partida =
        document.getElementById("partida").value;

    let solicitud =
        document.getElementById("solicitud").value;

    worksheet.getCell('A10').value = "Titular:";
    worksheet.getCell('B10').value = responsableTitular;

    worksheet.getCell('E10').value = "Recibe:";
    worksheet.getCell('F10').value = persona;

    worksheet.getCell('A11').value = "Área:";
    worksheet.getCell('B11').value = responsableArea;

    worksheet.getCell('E11').value = "Área:";
    worksheet.getCell('F11').value = areaRecibe;

    worksheet.getCell('A12').value = "Teléfono:";
    worksheet.getCell('B12').value = responsableTelefono;

    worksheet.getCell('E12').value = "Partida:";
    worksheet.getCell('F12').value = partida;

    worksheet.getCell('A13').value = "Email:";
    worksheet.getCell('B13').value = responsableEmail;

    worksheet.getCell('E13').value = "Solicitud:";
    worksheet.getCell('F13').value = solicitud;

    /* ---------- DATOS ENTREGA ---------- */

    worksheet.mergeCells('A15:G15');

    worksheet.getCell('A15').value =
        "DATOS DE ENTREGA";

    worksheet.getCell('A15').font = {
        bold: true,
        color: { argb: "FFFFFFFF" }
    };

    worksheet.getCell('A15').fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "C00000" }
    };

    worksheet.getCell('A16').value = "N° Nota:";
    worksheet.getCell('B16').value =
        document.getElementById("numeroNota").value;

    worksheet.getCell('D16').value = "Fecha Emisión:";
    worksheet.getCell('E16').value =
        document.getElementById("fechaEmision").value;

    worksheet.getCell('A17').value = "Fecha Entrega:";
    worksheet.getCell('B17').value =
        document.getElementById("fechaEntrega").value;

    /* ---------- TABLA ---------- */

    const encabezados = [
        "CÓDIGO",
        "PRODUCTO",
        "CANTIDAD",
        "PRECIO UNITARIO",
        "IMPORTE"
    ];

    let filaInicio = 20;

    const headerRow =
        worksheet.getRow(filaInicio);

    encabezados.forEach((titulo, index) => {

        const cell =
            headerRow.getCell(index + 1);

        cell.value = titulo;

        cell.font = {
            bold: true,
            color: { argb: "FFFFFFFF" }
        };

        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "1F4E78" }
        };

        cell.alignment = {
            horizontal: "center"
        };

        cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" }
        };
    });

    let totalImporte = 0;

    /* ---------- PRODUCTOS ---------- */

    nota.forEach((n, i) => {

        let fila =
            worksheet.getRow(filaInicio + i + 1);

        fila.getCell(1).value = n.codigo;
        fila.getCell(2).value = n.nombre;
        fila.getCell(3).value = n.cantidad;
        fila.getCell(4).value = n.precioUnitario;
        fila.getCell(5).value = n.importe;

        totalImporte += n.importe;

        fila.eachCell(cell => {

            cell.border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" }
            };

            cell.alignment = {
                horizontal: "center"
            };
        });
    });

    /* ---------- TOTAL ---------- */

    let filaTotal =
        filaInicio + nota.length + 2;

    worksheet.mergeCells(`A${filaTotal}:D${filaTotal}`);

    worksheet.getCell(`A${filaTotal}`).value =
        `TOTAL: $${totalImporte.toFixed(2)}`;

    worksheet.getCell(`A${filaTotal}`).font = {
        bold: true
    };

    worksheet.getCell(`A${filaTotal}`).alignment = {
        horizontal: "right"
    };

    /* ---------- FIRMAS ---------- */

    let filaFirmas = filaTotal + 4;

    worksheet.mergeCells(`A${filaFirmas}:B${filaFirmas}`);

    worksheet.mergeCells(`E${filaFirmas}:F${filaFirmas}`);

    worksheet.getCell(`A${filaFirmas}`).value =
        "ENTREGA";

    worksheet.getCell(`E${filaFirmas}`).value =
        "RECIBE";

    worksheet.getCell(`A${filaFirmas}`).font = {
        bold: true
    };

    worksheet.getCell(`E${filaFirmas}`).font = {
        bold: true
    };

    worksheet.getCell(`A${filaFirmas}`).alignment = {
        horizontal: "center"
    };

    worksheet.getCell(`E${filaFirmas}`).alignment = {
        horizontal: "center"
    };

    /* ---------- DESCARGAR ---------- */

    const buffer =
        await workbook.xlsx.writeBuffer();

    saveAs(

        new Blob([buffer], {

            type:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        }),

        "NOTA_DE_ENTREGA.xlsx"
    );
}