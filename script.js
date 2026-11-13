// ==========================================
// 1. INSTALACIÓN PWA Y ESTADO DE RED
// ==========================================
let deferredPrompt;
const btnInstalar = document.getElementById('btnInstalar');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    btnInstalar.classList.remove('d-none');
});

btnInstalar.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') btnInstalar.classList.add('d-none');
    deferredPrompt = null;
});

function gestionarEstadoRed() {
    if (navigator.onLine) {
        $('#estadoRed').text('🟢 En Línea').removeClass('bg-warning').addClass('bg-success');
        $('#alertaRed').addClass('d-none');
        $('#formReserva').find('input, select, button').prop('disabled', false);
    } else {
        $('#estadoRed').text('🟠 Offline').removeClass('bg-success').addClass('bg-warning');
        $('#alertaRed').removeClass('d-none');
        $('#formReserva').find('input, select, button').prop('disabled', true);
        mostrarToast('Sin Conexión', 'Formulario bloqueado.');
    }
}
$(window).on('online offline', gestionarEstadoRed);
$(document).ready(gestionarEstadoRed);

// ==========================================
// 2. FETCH CATÁLOGO (Lazy Loading)
// ==========================================
$(document).ready(function() {
    fetch('data/canciones.json')
        .then(res => { if(!res.ok) throw new Error(); return res.json(); })
        .then(canciones => {
            let html = '';
            canciones.forEach((item, i) => {
                html += `
                <article class="tarjeta-pista" data-id="${item.id}" data-titulo="${item.titulo}" data-artista="${item.artista}" data-hd="${item.portada_hd}" data-letra="${item.letra}" style="animation-delay: ${i * 0.05}s">
                    <img src="${item.portada}" alt="${item.titulo}" loading="lazy" class="img-portada">
                    <div class="info-pista">
                        <h4>${item.titulo}</h4>
                        <p>${item.artista}</p>
                    </div>
                    <i class="ph ph-caret-right text-gradient fs-4"></i>
                </article>`;
            });
            $('#catalogoKaraoke').html(html);
        })
        .catch(() => $('#catalogoKaraoke').html('<p class="text-danger text-center w-100">Error al cargar.</p>'));
});

// ==========================================
// 3. MODAL KARAOKE Y COLA (.off().on())
// ==========================================
$(document).ready(function() {
    $(document).off('click', '.tarjeta-pista').on('click', '.tarjeta-pista', function() {
        let hd = $(this).data('hd');
        $('#pistaTitulo').text($(this).data('titulo'));
        $('#pistaArtista').text($(this).data('artista'));

        // Formatear la letra: reemplazar saltos de línea por <br> para que se vea bien
        let letraRaw = $(this).data('letra');
        let letraFormateada = letraRaw.split('\n').join('<br><br>');
        $('#pistaLetra').html(letraFormateada);

        $('#pistaImgHD').attr('src', hd);

        let id = $(this).data('id');
        let titulo = $(this).data('titulo');

        $('#btnAgregarDesdeModal').off('click').on('click', function() {
            if($(`#cola-${id}`).length > 0) {
                mostrarToast('Atención', 'Esta pista ya está en tu cola.');
            } else {
                $('.empty-cola').remove();
                $('#listaCola').append(`
                    <li id="cola-${id}" class="list-group-item bg-transparent cola-item d-flex justify-content-between align-items-center">
                        <span class="text-truncate fw-bold" style="max-width: 80%;"><i class="ph ph-music-note text-gradient"></i> ${titulo}</span>
                        <span class="badge bg-secondary">#${$('#listaCola li').length + 1}</span>
                    </li>
                `);
                mostrarToast('¡Agregada!', titulo + ' está en tu cola.');
            }
            $('#modalPista').modal('hide');
        });

        new bootstrap.Modal(document.getElementById('modalPista')).show();
    });
});

// ==========================================
// 4. FORMULARIO ANTI-XSS Y VALIDACIONES (PDF)
// ==========================================
$(document).ready(function() {
    $('#formReserva').off('submit').on('submit', function(e) {
        e.preventDefault();

        if(!navigator.onLine) {
            mostrarToast('Error', 'No hay conexión a internet.');
            return;
        }

        let nombre = $('#clienteNombre').val().trim();
        let sala = $('#salaSelect').val();
        let valido = true;

        if(!nombre) {
            $('#clienteNombre').addClass('is-invalid');
            $('#errorNombre').removeClass('d-none');
            valido = false;
        } else {
            $('#clienteNombre').removeClass('is-invalid');
            $('#errorNombre').addClass('d-none');
        }

        let canciones = $('#listaCola li:not(.empty-cola)').length;
        if(canciones === 0) {
            mostrarToast('Atención', 'Agrega al menos 1 canción a tu cola.');
            valido = false;
        }

        if(!valido) return;

        // ==========================================
        // PREVENCIÓN XSS (Práctica Correcta del PDF)
        // ==========================================
        let $item = $('<li>').addClass('item-reserva d-flex justify-content-between align-items-center mb-2 pb-2');
        let $textSeguro = $('<strong>').text(nombre + ' - ').addClass('text-white');
        let $detalleSala = $('<span>').text(sala).addClass('badge bg-purple');

        $item.append($textSeguro, $detalleSala);
        $('#listaReservas').append($item);
        $item.hide().fadeIn(400);

        mostrarToast('¡Reserva Exitosa!', nombre + ', tu ' + sala + ' está confirmada.');

        this.reset();
        $('#listaCola').html('<li class="list-group-item bg-transparent text-muted text-center border-0 empty-cola">Aún no has elegido canciones.</li>');
    });

    $('#clienteNombre').on('input', function() {
        if($(this).val().trim().length > 0) {
            $(this).removeClass('is-invalid');
            $('#errorNombre').addClass('d-none');
        }
    });
});

// ==========================================
// UTILIDADES
// ==========================================
function mostrarToast(titulo, mensaje) {
    $('#toastTitulo').text(titulo);
    $('#toastMensaje').text(mensaje);
    $('#toast').fadeIn('fast');
    setTimeout(() => $('#toast').fadeOut('slow'), 3500);
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
}
