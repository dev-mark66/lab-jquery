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
// 2. CONTROL DE MENÚ Y VARIABLES
// ==========================================
let carrito = [];
let precioBaseSala = 50;

$(document).ready(function() {
    $('.nav-item').on('click', function(e) {
        e.preventDefault();
        $('.nav-item').removeClass('active');
        $(this).addClass('active');
        $('.app-view').removeClass('active');
        $('#' + $(this).data('target')).addClass('active');
    });
});

// ==========================================
// 3. CARGA DE DATOS (PISTAS Y EXTRAS)
// ==========================================
$(document).ready(function() {
    // Cargar Pistas
    fetch('data/canciones.json')
        .then(res => res.json())
        .then(data => {
            let html = '';
            data.forEach(item => {
                html += `
                <article class="tarjeta-prod pista-card" data-titulo="${item.titulo}" data-artista="${item.artista}" data-hd="${item.portada_hd}" data-letra="${item.letra}" data-album="${item.album}" data-genero="${item.genero}">
                    <img src="${item.portada}" loading="lazy">
                    <div class="info-prod"><h4>${item.titulo}</h4><p>${item.artista}</p></div>
                    <i class="ph ph-caret-right text-muted"></i>
                </article>`;
            });
            $('#catalogoKaraoke').html(html);
        });

    // Cargar Extras
    fetch('data/extras.json')
        .then(res => res.json())
        .then(data => {
            let htmlS = '', htmlB = '';
            data.snacks.forEach(item => {
                htmlS += `
                <article class="tarjeta-prod prod-card" data-tipo="Snack" data-titulo="${item.titulo}" data-precio="${item.precio}" data-desc="${item.desc}" data-img="${item.portada}">
                    <img src="${item.portada}" loading="lazy">
                    <div class="info-prod"><h4>${item.titulo}</h4><p>${item.desc}</p></div>
                    <span class="precio">${item.precio} Bs</span>
                </article>`;
            });
            data.bebidas.forEach(item => {
                htmlB += `
                <article class="tarjeta-prod prod-card" data-tipo="Bebida" data-titulo="${item.titulo}" data-precio="${item.precio}" data-desc="${item.desc}" data-img="${item.portada}">
                    <img src="${item.portada}" loading="lazy">
                    <div class="info-prod"><h4>${item.titulo}</h4><p>${item.desc}</p></div>
                    <span class="precio">${item.precio} Bs</span>
                </article>`;
            });
            $('#catalogoSnacks').html(htmlS);
            $('#catalogoBebidas').html(htmlB);
        });
});

// ==========================================
// 4. MODALES
// ==========================================
$(document).ready(function() {
    $(document).off('click', '.pista-card').on('click', '.pista-card', function() {
        $('#pistaTitulo').text($(this).data('titulo'));
        $('#pistaArtista').text($(this).data('artista'));
        $('#pistaAlbum').text($(this).data('album'));
        $('#pistaGenero').text($(this).data('genero'));
        $('#pistaLetra').html($(this).data('letra').split('\n').join('<br><br>'));
        $('#pistaImgHD').attr('src', $(this).data('hd'));

        let titulo = $(this).data('titulo');

        $('#btnAgregarPista').off('click').on('click', function() {
            agregarAlCarrito('Pista', titulo, 0);
            $('#modalPista').modal('hide');
        });
        new bootstrap.Modal(document.getElementById('modalPista')).show();
    });

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
// 5. CARRITO Y TICKET
// ==========================================
function agregarAlCarrito(tipo, titulo, precio) {
    let item = carrito.find(i => i.titulo === titulo);
    if(item) { item.cantidad++; } else { carrito.push({ tipo, titulo, precio, cantidad: 1 }); }
    mostrarToast('Agregado', titulo + ' sumado.');
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
        html += `<li class="d-flex justify-content-between mb-1"><span class="text-truncate" style="max-width: 70%;">${item.titulo}</span><span class="text-info">${precioTexto}</span></li>`;
    });
    $('#listaResumen').html(html);
}

// ==========================================
// 6. GENERAR TICKET Y PDF
// ==========================================
$(document).ready(function() {
    $('#btnConfirmar').on('click', function() {
        let nombre = $('#clienteNombre').val().trim();
        let sala = $('#salaSelect').val();

        if(!nombre) { $('#clienteNombre').addClass('is-invalid'); $('#errorNombre').removeClass('d-none'); return; }
        else { $('#clienteNombre').removeClass('is-invalid'); $('#errorNombre').addClass('d-none'); }

        if(carrito.length === 0) { mostrarToast('Atención', 'Agrega algo a la reserva.'); return; }

        let totalExtras = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
        let totalFinal = precioBaseSala + totalExtras;

        $('#ticketCliente').text(nombre);
        $('#ticketSala').text(sala);
        $('#ticketTotal').text(totalFinal);
        $('#ticketFecha').text(new Date().toLocaleString());

        let $ul = $('#ticketDetalle'); $ul.empty();

        let $liSala = $('<li>').css('display','flex').css('justify-content','space-between').css('margin-bottom','5px');
        $liSala.append($('<span>').text('Alquiler ' + sala));
        $liSala.append($('<span>').text(precioBaseSala + ' Bs'));
        $ul.append($liSala);

        carrito.forEach(item => {
            let $li = $('<li>').css('display','flex').css('justify-content','space-between').css('margin-bottom','5px');
            let texto = item.tipo === 'Pista' ? '🎵 ' + item.titulo : `${item.cantidad}x ${item.titulo}`;
            let precio = item.precio > 0 ? (item.precio * item.cantidad) + ' Bs' : 'Incluido';
            $li.append($('<span>').text(texto));
            $li.append($('<span>').text(precio));
            $ul.append($li);
        });

        new bootstrap.Modal(document.getElementById('modalTicket')).show();
    });

    $('#btnDescargarPDF').on('click', function() {
        const element = document.getElementById('ticketVisual');
        const opt = {
            margin: 0.5, filename: 'Ticket_Karaoke_UPDS.pdf',
            image: { type: 'jpeg', quality: 1 },
            html2canvas: { scale: 2, backgroundColor: '#ffffff' },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    });

    $('#btnCerrarTicket').on('click', function() {
        $('#formReserva')[0].reset();
        carrito = [];
        renderizarResumen();
        $('#clienteNombre').val('');
        $('.nav-item[data-target="view-reserva"]').click(); // Vuelve a inicio
    });
});

function mostrarToast(titulo, mensaje) {
    $('#toastTitulo').text(titulo);
    $('#toastMensaje').text(mensaje);
    $('#toast').fadeIn('fast');
    setTimeout(() => $('#toast').fadeOut('slow'), 3000);
}
