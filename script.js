// ==========================================
// MÓDULO 1: CONEXIÓN Y MANEJO DE ESTADO
// ==========================================
function gestionarEstadoRed() {
    if (navigator.onLine) {
        $('#estadoRed').text('🟢 En Línea').removeClass('bg-warning text-dark').addClass('bg-success');
        $('#alertaRed').addClass('d-none');

        // Restauramos el formulario
        $('#formReserva').find('input, button').prop('disabled', false);
        let datosGuardados = JSON.parse(localStorage.getItem('reservaOffline'));
        if(datosGuardados) {
            $('#nombreReserva').val(datosGuardados.nombre);
            $('#telefonoReserva').val(datosGuardados.telefono);
            $('#fechaReserva').val(datosGuardados.fecha);
            $('#horaReserva').val(datosGuardados.hora);
            mostrarToast('Conexión Restablecida', 'Tus datos han sido restaurados.');
            localStorage.removeItem('reservaOffline');
        }
    } else {
        $('#estadoRed').text('🟠 Offline').removeClass('bg-success').addClass('bg-warning text-dark');
        $('#alertaRed').removeClass('d-none');

        // Guardamos y bloqueamos
        if($('#nombreReserva').val() || $('#telefonoReserva').val()) {
            let datos = {
                nombre: $('#nombreReserva').val(),
                telefono: $('#telefonoReserva').val(),
                fecha: $('#fechaReserva').val(),
                hora: $('#horaReserva').val()
            };
            localStorage.setItem('reservaOffline', JSON.stringify(datos));
            mostrarToast('Sin Conexión', 'Formulario bloqueado. Datos guardados temporalmente.');
        }
        $('#formReserva').find('input, button').prop('disabled', true);
    }
}
$(window).on('online offline', gestionarEstadoRed);
$(document).ready(gestionarEstadoRed);

// ==========================================
// MÓDULO 2: FETCH CATÁLOGO
// ==========================================
$(document).ready(function() {
    fetch('data/canciones.json')
        .then(response => {
            if (!response.ok) throw new Error('Error HTTP');
            return response.json();
        })
        .then(canciones => {
            let html = '';
            canciones.forEach((item, index) => {
                let delay = index * 0.05;
                // Aquí se aplica Lazy Loading a la miniatura
                html += `
                <article class="tarjeta-pista" data-id="${item.id}" data-titulo="${item.titulo}" data-artista="${item.artista}" data-genero="${item.genero}" data-hd="${item.portada_hd}" data-letra="${item.letra}" style="animation-delay: ${delay}s">
                    <img src="${item.portada}" alt="${item.titulo}" loading="lazy" class="img-portada" width="48" height="48">
                    <div class="info-pista">
                        <h4>${item.titulo}</h4>
                        <p>${item.artista} • ${item.genero}</p>
                    </div>
                    <i class="ph ph-caret-right text-neon fs-4"></i>
                </article>`;
            });
            $('#catalogoKaraoke').html(html);
        })
        .catch(err => {
            $('#catalogoKaraoke').html('<p class="text-danger text-center w-100">Error al cargar catálogo.</p>');
        });
});

// ==========================================
// MÓDULO 3: MODAL CON DISCO Y LETRA
// ==========================================
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

        // Lazy Loading para la imagen HD del vinilo
        $('#pistaImgHD').attr('src', 'https://cdn-icons-png.flaticon.com/512/6596/6596121.png').css('opacity', '0.5');
        let img = new Image();
        img.onload = function() { $('#pistaImgHD').attr('src', hd).css('opacity', '1'); };
        img.src = hd;

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
            <li id="cola-${id}" class="list-group-item bg-transparent text-light cola-item d-flex justify-content-between align-items-center px-0">
                <span class="text-truncate" style="max-width: 80%;"><i class="ph ph-music-note text-neon"></i> ${titulo}</span>
                <span class="badge bg-info text-dark">#${$('#listaCola li').length + 1}</span>
            </li>
        `);
        mostrarToast('¡Pista Agregada!', titulo + ' está en tu cola.');
    }
});

// ==========================================
// MÓDULO 4: FORMULARIO, VALIDACIÓN Y PAGO
// ==========================================
$(document).ready(function() {
    let timerInterval;

    $('#horasReserva').on('input', function() {
        let hrs = $(this).val() || 1;
        if(hrs < 1) { hrs = 1; $(this).val(1); }
        if(hrs > 5) { hrs = 5; $(this).val(5); }
        $('#totalPagar').text(hrs * 50);
    });

    $('#formReserva').on('submit', function(e) {
        e.preventDefault();

        if(!navigator.onLine) {
            mostrarToast('Sin Conexión', 'No puedes reservar sin internet.');
            return;
        }

        let nombre = $('#nombreReserva').val().trim();
        let telefono = $('#telefonoReserva').val().trim();
        let fecha = $('#fechaReserva').val();
        let hora = $('#horaReserva').val();
        let canciones = $('#listaCola li').length;
        let valido = true;

        if(nombre.length < 3) {
            $('#nombreReserva').addClass('is-invalid border-danger');
            $('#errorNombre').removeClass('d-none');
            valido = false;
        } else {
            $('#nombreReserva').removeClass('is-invalid border-danger').addClass('border-secondary');
            $('#errorNombre').addClass('d-none');
        }

        if(telefono.length < 7) {
            $('#telefonoReserva').addClass('is-invalid border-danger');
            $('#errorTelefono').removeClass('d-none');
            valido = false;
        } else {
            $('#telefonoReserva').removeClass('is-invalid border-danger').addClass('border-secondary');
            $('#errorTelefono').addClass('d-none');
        }

        if(!fecha) { $('#errorFecha').removeClass('d-none'); valido = false; } else { $('#errorFecha').addClass('d-none'); }
        if(!hora) { $('#errorHora').removeClass('d-none'); valido = false; } else { $('#errorHora').addClass('d-none'); }

        if(canciones === 0) {
            mostrarToast('Atención', 'Debes elegir al menos 1 canción.');
            valido = false;
        }

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

    // Pago Simulado (Hidratación)
    $('#btnPagarFinal').off('click').on('click', function() {
        clearInterval(timerInterval);
        $('#modalPago').modal('hide');
        mostrarToast('¡Pago Exitoso!', 'Reserva confirmada. ¡A cantar!');

        $('#formReserva')[0].reset();
        $('#totalPagar').text('50');
        $('#listaCola').html('<li class="list-group-item bg-transparent text-muted text-center border-0 empty-cola">No has elegido pistas.</li>');
    });

    $('#btnCancelarPago').on('click', function() {
        clearInterval(timerInterval);
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
