// ==========================================
// 1. ACTUALIZACIÓN PWA Y RED
// ==========================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(reg => {
            reg.onupdatefound = () => {
                const worker = reg.installing;
                worker.onstatechange = () => {
                    if (worker.state === 'installed' && navigator.serviceWorker.controller) {
                        window.location.reload();
                    }
                };
            };
        });
    });
}

function gestionarEstadoRed() {
    if (navigator.onLine) {
        $('#estadoRed').text('🟢 En Línea').removeClass('bg-warning').addClass('bg-success');
    } else {
        $('#estadoRed').text('🟠 Offline').removeClass('bg-success').addClass('bg-warning');
    }
}
$(window).on('online offline', gestionarEstadoRed);
$(document).ready(gestionarEstadoRed);

// ==========================================
// 2. VARIABLES Y CONTROL DE TABS
// ==========================================
let carrito = []; // { tipo, titulo, precio, cantidad }
let precioBaseSala = 50; // Costo fijo de sala por hora o base

$(document).ready(function() {
    // Control de Pestañas
    $('.tab-btn').on('click', function() {
        $('.tab-btn').removeClass('active');
        $(this).addClass('active');
        $('.tab-content').removeClass('active');
        $('#' + $(this).data('target')).addClass('active');
    });
});

// ==========================================
// 3. CARGAR DATOS (FETCH)
// ==========================================
$(document).ready(function() {
    fetch('data/productos.json')
        .then(res => res.json())
        .then(data => {
            // PISTAS
            let htmlPistas = '';
            data.pistas.forEach(item => {
                htmlPistas += `
                <article class="tarjeta-prod pista-card" data-id="${item.id}" data-titulo="${item.titulo}" data-artista="${item.artista}" data-hd="${item.portada_hd}" data-letra="${item.letra}" data-album="${item.album}" data-anio="${item.anio}" data-genero="${item.genero}" data-duracion="${item.duracion}">
                    <img src="${item.portada}" loading="lazy" class="img-portada">
                    <div class="info-prod">
                        <h4 class="text-truncate">${item.titulo}</h4>
                        <p class="text-truncate">${item.artista}</p>
                    </div>
                    <i class="ph ph-caret-right text-muted fs-4"></i>
                </article>`;
            });
            $('#catalogoKaraoke').html(htmlPistas);

            // SNACKS
            let htmlSnacks = '';
            data.snacks.forEach(item => {
                htmlSnacks += `
                <article class="tarjeta-prod prod-card" data-tipo="Snack" data-titulo="${item.titulo}" data-precio="${item.precio}" data-desc="${item.desc}" data-img="${item.portada}">
                    <img src="${item.portada}" loading="lazy" class="img-portada">
                    <div class="info-prod">
                        <h4 class="text-truncate">${item.titulo}</h4>
                        <p class="text-truncate">${item.desc}</p>
                    </div>
                    <span class="precio">${item.precio} Bs</span>
                </article>`;
            });
            $('#catalogoSnacks').html(htmlSnacks);

            // BEBIDAS
            let htmlBebidas = '';
            data.bebidas.forEach(item => {
                htmlBebidas += `
                <article class="tarjeta-prod prod-card" data-tipo="Bebida" data-titulo="${item.titulo}" data-precio="${item.precio}" data-desc="${item.desc}" data-img="${item.portada}">
                    <img src="${item.portada}" loading="lazy" class="img-portada">
                    <div class="info-prod">
                        <h4 class="text-truncate">${item.titulo}</h4>
                        <p class="text-truncate">${item.desc}</p>
                    </div>
                    <span class="precio">${item.precio} Bs</span>
                </article>`;
            });
            $('#catalogoBebidas').html(htmlBebidas);
        });
});

// ==========================================
// 4. MODAL DE PISTAS (INFO COMPLETA)
// ==========================================
$(document).ready(function() {
    $(document).off('click', '.pista-card').on('click', '.pista-card', function() {
        $('#pistaTitulo').text($(this).data('titulo'));
        $('#pistaArtista').text($(this).data('artista'));
        $('#pistaAlbum').text($(this).data('album'));
        $('#pistaAnio').text($(this).data('anio'));
        $('#pistaGenero').text($(this).data('genero'));
        $('#pistaDuracion').text($(this).data('duracion'));
        $('#pistaLetra').html($(this).data('letra').split('\n').join('<br><br>'));
        $('#pistaImgHD').attr('src', $(this).data('hd'));

        let titulo = $(this).data('titulo');

        $('#btnAgregarPista').off('click').on('click', function() {
            agregarAlCarrito('Pista', titulo, 0); // Las pistas no tienen costo extra, van incluidas en la sala
            $('#modalPista').modal('hide');
        });

        new bootstrap.Modal(document.getElementById('modalPista')).show();
    });
});

// ==========================================
// 5. MODAL DE SNACKS/BEBIDAS
// ==========================================
$(document).ready(function() {
    $(document).off('click', '.prod-card').on('click', '.prod-card', function() {
        $('#prodTitulo').text($(this).data('titulo'));
        $('#prodDesc').text($(this).data('desc'));
        $('#prodPrecio').text($(this).data('precio') + ' BOB');
        $('#prodImg').attr('src', $(this).data('img'));

        let tipo = $(this).data('tipo');
        let titulo = $(this).data('titulo');
        let precio = $(this).data('precio');

        $('#btnAgregarProd').off('click').on('click', function() {
            agregarAlCarrito(tipo, titulo, precio);
            $('#modalProducto').modal('hide');
        });

        new bootstrap.Modal(document.getElementById('modalProducto')).show();
    });
});

// ==========================================
// 6. LÓGICA DEL CARRITO Y RESUMEN
// ==========================================
function agregarAlCarrito(tipo, titulo, precio) {
    // Buscar si ya existe
    let item = carrito.find(i => i.titulo === titulo);
    if(item) {
        item.cantidad++;
    } else {
        carrito.push({ tipo, titulo, precio, cantidad: 1 });
    }
    mostrarToast('Agregado', titulo + ' sumado a la reserva.');
    renderizarResumen();
}

function renderizarResumen() {
    if(carrito.length === 0) {
        $('#listaResumen').html('<li>No has agregado nada aún.</li>');
        return;
    }

    let html = '';
    carrito.forEach(item => {
        let precioTexto = item.precio > 0 ? `(x${item.cantidad}) - ${item.precio * item.cantidad} Bs` : `(x${item.cantidad})`;
        html += `<li class="d-flex justify-content-between mb-1">
                    <span class="text-truncate" style="max-width: 70%;">${item.titulo}</span>
                    <span class="text-info">${precioTexto}</span>
                 </li>`;
    });
    $('#listaResumen').html(html);
}

// ==========================================
// 7. GENERAR TICKET PDF (CON ANTI-XSS)
// ==========================================
$(document).ready(function() {
    $('#formReserva').off('submit').on('submit', function(e) {
        e.preventDefault();

        let nombre = $('#clienteNombre').val().trim();
        let sala = $('#salaSelect').val();

        if(!nombre) {
            $('#clienteNombre').addClass('is-invalid');
            $('#errorNombre').removeClass('d-none');
            return;
        } else {
            $('#clienteNombre').removeClass('is-invalid');
            $('#errorNombre').addClass('d-none');
        }

        if(carrito.length === 0) {
            mostrarToast('Atención', 'Debes agregar al menos 1 producto o pista.');
            return;
        }

        // Calcular Total
        let totalExtras = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
        let totalFinal = precioBaseSala + totalExtras; // Sala base 50 Bs + extras

        // ==========================================
        // PREVENCIÓN XSS: Usar .text() para inyectar datos
        // ==========================================
        $('#ticketCliente').text(nombre);
        $('#ticketSala').text(sala);
        $('#ticketTotal').text(totalFinal);

        // Fecha formateada
        let hoy = new Date();
        $('#ticketFecha').text(hoy.toLocaleDateString() + ' ' + hoy.toLocaleTimeString());

        // Detalle del Ticket (Usando nodos seguros)
        let $ul = $('#ticketDetalle');
        $ul.empty();

        // Agregar Sala
        let $liSala = $('<li>').addClass('d-flex justify-content-between mb-1');
        $liSala.append($('<span>').text('Alquiler ' + sala));
        $liSala.append($('<span>').text(precioBaseSala + ' Bs'));
        $ul.append($liSala);

        // Agregar Productos
        carrito.forEach(item => {
            let $li = $('<li>').addClass('d-flex justify-content-between mb-1');
            let texto = item.tipo === 'Pista' ? '🎵 ' + item.titulo : `${item.cantidad}x ${item.titulo}`;
            let precio = item.precio > 0 ? (item.precio * item.cantidad) + ' Bs' : 'Incluido';

            $li.append($('<span>').text(texto));
            $li.append($('<span>').text(precio));
            $ul.append($li);
        });

        // Mostrar Modal Ticket
        new bootstrap.Modal(document.getElementById('modalTicket')).show();
    });

    // Descargar PDF
    $('#btnDescargarPDF').on('click', function() {
        const element = document.getElementById('ticketVisual');
        const opt = {
            margin:       0.5,
            filename:     'Ticket_Karaoke_UPDS.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    });

    // Cerrar ticket y limpiar
    $('#btnCerrarTicket').on('click', function() {
        this.reset();
        carrito = [];
        renderizarResumen();
        $('#clienteNombre').val('');
    });
});

// ==========================================
// UTILIDADES
// ==========================================
function mostrarToast(titulo, mensaje) {
    $('#toastTitulo').text(titulo);
    $('#toastMensaje').text(mensaje);
    $('#toast').fadeIn('fast');
    setTimeout(() => $('#toast').fadeOut('slow'), 3000);
}
