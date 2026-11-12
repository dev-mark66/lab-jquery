// ==========================================
// 1. MENÚ LATERAL Y NAVEGACIÓN
// ==========================================
$(document).ready(function() {
    $('#menuToggle').on('click', function() {
        $('#sideMenu').addClass('open');
        $('#menuOverlay').addClass('open');
    });

    $('#menuOverlay, .menu-item').on('click', function(e) {
        if (e.target.classList.contains('menu-item')) {
            e.preventDefault();
            let target = $(this).data('target');
            $('.menu-item').removeClass('active');
            $(this).addClass('active');
            $('.app-view').removeClass('active');
            $('#' + target).addClass('active');
        }
        $('#sideMenu').removeClass('open');
        $('#menuOverlay').removeClass('open');
    });
});

// ==========================================
// 2. ESTADO DE RED Y PWA (INSTALACIÓN)
// ==========================================
let deferredPrompt;
const btnInstalar = document.getElementById('btnInstalar');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    btnInstalar.classList.remove('d-none'); // Mostrar botón
});

btnInstalar.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
        btnInstalar.classList.add('d-none');
    }
    deferredPrompt = null;
});

function gestionarEstadoRed() {
    if (navigator.onLine) {
        $('#estadoRed').text('🟢').removeClass('bg-warning').addClass('bg-success');
        $('#alertaRed').addClass('d-none');
        $('#formReserva').find('input, button').prop('disabled', false);
    } else {
        $('#estadoRed').text('🟠').removeClass('bg-success').addClass('bg-warning');
        $('#alertaRed').removeClass('d-none');
        $('#formReserva').find('input, button').prop('disabled', true);
        mostrarToast('Sin Conexión', 'Formulario bloqueado temporalmente.');
    }
}
$(window).on('online offline', gestionarEstadoRed);
$(document).ready(gestionarEstadoRed);

// ==========================================
// 3. FETCH CATÁLOGO Y MODAL (Disco + Letra)
// ==========================================
$(document).ready(function() {
    fetch('data/canciones.json')
        .then(res => { if(!res.ok) throw new Error(); return res.json(); })
        .then(canciones => {
            let html = '';
            canciones.forEach((item, i) => {
                html += `
                <article class="tarjeta-pista" data-id="${item.id}" data-titulo="${item.titulo}" data-artista="${item.artista}" data-genero="${item.genero}" data-hd="${item.portada_hd}" data-letra="${item.letra}" style="animation-delay: ${i * 0.05}s">
                    <img src="${item.portada}" alt="${item.titulo}" loading="lazy" class="img-portada">
                    <div class="info-pista">
                        <h4>${item.titulo}</h4>
                        <p>${item.artista} • ${item.genero}</p>
                    </div>
                    <i class="ph ph-caret-right text-muted"></i>
                </article>`;
            });
            $('#catalogoKaraoke').html(html);
        })
        .catch(() => $('#catalogoKaraoke').html('<p class="text-danger text-center">Error al cargar catálogo.</p>'));
});

$(document).ready(function() {
    $(document).off('click', '.tarjeta-pista').on('click', '.tarjeta-pista', function() {
        let titulo = $(this).data('titulo');
        let artista = $(this).data('artista');
        let genero = $(this).data('genero');
        let hd = $(this).data('hd');
        let letra = $(this).data('letra');
        let id = $(this).data('id');

        $('#pistaTitulo').text(titulo);
        $('#pistaArtista').text(artista + ' • ' + genero);
        $('#pistaLetra').text(letra);

        // Lazy loading de imagen
        $('#pistaImgHD').attr('src', hd);

        $('#btnAgregarDesdeModal').off('click').on('click', function() {
            agregarACola(id, titulo);
            $('#modalPista').modal('hide');
        });

        let modalPista = new bootstrap.Modal(document.getElementById('modalPista'));
        modalPista.show();
    });

    function agregarACola(id, titulo) {
        if($(`#cola-${id}`).length > 0) {
            mostrarToast('Ya está en la cola', titulo + ' ya fue agregada.');
            return;
        }
        $('.empty-cola').remove();
        $('#listaCola').append(`
            <li id="cola-${id}" class="list-group-item bg-transparent text-light cola-item d-flex justify-content-between align-items-center">
                <span class="text-truncate" style="max-width: 80%;"><i class="ph ph-music-note text-info"></i> ${titulo}</span>
                <span class="badge bg-info text-dark">#${$('#listaCola li').length + 1}</span>
            </li>
        `);
        mostrarToast('¡Pista Agregada!', titulo + ' está en tu cola.');
    }
});

// ==========================================
// 4. FORMULARIO, FECHAS Y PAGO
// ==========================================
$(document).ready(function() {
    let timerInterval;

    // Configurar fecha mínima (hoy) y hora de atención
    let today = new Date().toISOString().split('T')[0];
    $('#fechaReserva').attr('min', today);

    $('#horasReserva').on('input', function() {
        let hrs = $(this).val() || 1;
        if(hrs < 1) { hrs = 1; $(this).val(1); }
        if(hrs > 5) { hrs = 5; $(this).val(5); }
        $('#totalPagar').text(hrs * 50);
    });

    $('#formReserva').on('submit', function(e) {
        e.preventDefault();
        if(!navigator.onLine) { mostrarToast('Sin Conexión', 'No puedes reservar sin internet.'); return; }

        let nombre = $('#nombreReserva').val().trim();
        let telefono = $('#telefonoReserva').val().trim();
        let fecha = $('#fechaReserva').val();
        let hora = $('#horaReserva').val();
        let canciones = $('#listaCola li').length;
        let valido = true;

        // Validaciones
        if(nombre.length < 3) { $('#nombreReserva').addClass('is-invalid'); $('#errorNombre').removeClass('d-none'); valido = false; }
        else { $('#nombreReserva').removeClass('is-invalid'); $('#errorNombre').addClass('d-none'); }

        if(telefono.length < 7) { $('#telefonoReserva').addClass('is-invalid'); $('#errorTelefono').removeClass('d-none'); valido = false; }
        else { $('#telefonoReserva').removeClass('is-invalid'); $('#errorTelefono').addClass('d-none'); }

        if(!fecha) { $('#errorFecha').removeClass('d-none'); valido = false; } else { $('#errorFecha').addClass('d-none'); }

        // Validar hora entre 18:00 y 23:00
        if(!hora || hora < "18:00" || hora > "23:00") {
            $('#errorHora').removeClass('d-none'); valido = false;
        } else {
            $('#errorHora').addClass('d-none');
        }

        if(canciones === 0) { mostrarToast('Atención', 'Debes elegir al menos 1 canción.'); valido = false; }

        if(valido) {
            $('#pagoTotal').text($('#totalPagar').text() + ' BOB');
            let modalPago = new bootstrap.Modal(document.getElementById('modalPago'));
            modalPago.show();

            let timeLeft = 30;
            $('#timerPago').text('00:30').removeClass('text-danger');
            clearInterval(timerInterval);

            timerInterval = setInterval(function() {
                timeLeft--;
                let s = timeLeft;
                $('#timerPago').text(`00:${s < 10 ? '0' : ''}${s}`);
                if(timeLeft <= 10) $('#timerPago').addClass('text-danger');
                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    modalPago.hide();
                    mostrarToast('Expirado', 'El tiempo de pago terminó.');
                }
            }, 1000);
        }
    });

    $('#btnPagarFinal').off('click').on('click', function() {
        clearInterval(timerInterval);
        $('#modalPago').modal('hide');
        mostrarToast('¡Pago Exitoso!', 'Reserva confirmada. ¡A cantar!');

        $('#formReserva')[0].reset();
        $('#totalPagar').text('50');
        $('#listaCola').html('<li class="list-group-item bg-transparent text-muted text-center border-0 empty-cola py-2">No has elegido pistas.</li>');
    });

    $('#btnCancelarPago').on('click', function() { clearInterval(timerInterval); });
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
