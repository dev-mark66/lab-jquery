// ==========================================
// MÓDULO 1: ESTADO DE RED
// ==========================================
function gestionarEstadoRed() {
    if (navigator.onLine) {
        $('#estadoRed').text('🟢 En Línea').removeClass('bg-warning text-dark').addClass('bg-success');
        $('#alertaRed').addClass('d-none');
    } else {
        $('#estadoRed').text('🟠 Offline').removeClass('bg-success').addClass('bg-warning text-dark');
        $('#alertaRed').removeClass('d-none');
    }
}
$(window).on('online offline', gestionarEstadoRed);
$(document).ready(gestionarEstadoRed);

// ==========================================
// MÓDULO 2: FETCH CATÁLOGO (Lazy Loading)
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
                html += `
                <article class="tarjeta-pista" data-id="${item.id}" data-titulo="${item.titulo}" style="animation-delay: ${delay}s">
                    <img src="${item.portada}" alt="${item.titulo}" loading="lazy" width="48" height="48">
                    <div class="info-pista">
                        <h4>${item.titulo}</h4>
                        <p>${item.artista} • ${item.genero}</p>
                    </div>
                    <button class="btn-agregar-cola"><i class="ph ph-plus"></i> Cola</button>
                </article>`;
            });
            $('#catalogoKaraoke').html(html);
        })
        .catch(err => {
            $('#catalogoKaraoke').html('<p class="text-danger text-center w-100">Error al cargar catálogo.</p>');
        });
});

// ==========================================
// MÓDULO 3: DELEGACIÓN DE EVENTOS (Cola)
// ==========================================
$(document).ready(function() {
    $(document).off('click', '.btn-agregar-cola').on('click', '.btn-agregar-cola', function() {
        let $tarjeta = $(this).closest('.tarjeta-pista');
        let titulo = $tarjeta.data('titulo');
        let id = $tarjeta.data('id');

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
        $(this).html('<i class="ph ph-check"></i> Añadido').prop('disabled', true).css('opacity', '0.5');
    });
});

// ==========================================
// MÓDULO 4: VALIDACIÓN Y RESERVA
// ==========================================
$(document).ready(function() {
    $('#horasReserva').on('input', function() {
        let hrs = $(this).val() || 1;
        if(hrs < 1) { hrs = 1; $(this).val(1); }
        if(hrs > 5) { hrs = 5; $(this).val(5); }
        $('#totalPagar').text(hrs * 50);
    });

    $('#formReserva').on('submit', function(e) {
        e.preventDefault();
        let nombre = $('#nombreReserva').val().trim();
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

        if(canciones === 0) {
            mostrarToast('Atención', 'Debes elegir al menos 1 canción para reservar.');
            return;
        }

        if(valido) {
            mostrarToast('¡Reserva Confirmada!', nombre + ', tu sala está lista por ' + $('#horasReserva').val() + ' horas.');

            $('#formReserva')[0].reset();
            $('#totalPagar').text('50');
            $('#listaCola').html('<li class="list-group-item bg-transparent text-muted text-center border-0 empty-cola">Aún no has elegido canciones.</li>');
            $('.btn-agregar-cola').html('<i class="ph ph-plus"></i> Cola').prop('disabled', false).css('opacity', '1');
        }
    });

    $('#nombreReserva').on('input', function() {
        if($(this).val().trim().length >= 3) {
            $(this).removeClass('is-invalid border-danger').addClass('border-secondary');
            $('#errorNombre').addClass('d-none');
        }
    });
});

// ==========================================
// UTILIDADES Y PWA
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
