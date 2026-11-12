// ==========================================
// MÓDULO 1: ESTADO DE RED (Validaciones)
// ==========================================
function gestionarEstadoRed() {
    if (navigator.onLine) {
        $('#estadoRed').text('🟢 En Línea').removeClass('bg-warning text-dark').addClass('bg-success');
        $('#alertaRed').addClass('d-none');
    } else {
        $('#estadoRed').text('🟠 Offline').removeClass('bg-success').addClass('bg-warning text-dark');
        $('#alertaRed').removeClass('d-none'); // Muestra la alerta visual
    }
}
$(window).on('online offline', gestionarEstadoRed);
$(document).ready(gestionarEstadoRed);

// ==========================================
// MÓDULO 2: CATÁLOGO FETCH Y LAZY LOADING
// ==========================================
$(document).ready(function() {
    fetch('data/canciones.json')
        .then(response => {
            if (!response.ok) throw new Error('Error al cargar JSON');
            return response.json();
        })
        .then(canciones => {
            let html = '';
            canciones.forEach(item => {
                // Lazy loading nativo en atributo 'loading'
                html += `
                <article class="tarjeta-pista" data-id="${item.id}" data-titulo="${item.titulo}">
                    <img src="${item.portada}" alt="${item.titulo}" loading="lazy" width="50" height="50">
                    <div class="info-pista">
                        <h4>${item.titulo}</h4>
                        <p>${item.artista} • ${item.genero}</p>
                    </div>
                    <button class="btn-agregar-cola">+ Cola</button>
                </article>`;
            });
            $('#catalogoKaraoke').html(html);
        })
        .catch(err => {
            console.error('Fallo en catálogo:', err);
            $('#catalogoKaraoke').html('<p class="text-danger text-center w-100">Error al cargar. Revisa tu conexión.</p>');
        });
});

// ==========================================
// MÓDULO 3: DELEGACIÓN DE EVENTOS (Cola)
// ==========================================
$(document).ready(function() {
    // PRÁCTICA CORRECTA: .off() antes de .on()
    $(document).off('click', '.btn-agregar-cola').on('click', '.btn-agregar-cola', function() {
        let $tarjeta = $(this).closest('.tarjeta-pista');
        let titulo = $tarjeta.data('titulo');

        // Añadir a la lista visual
        $('#listaCola').find('.text-muted').remove(); // Quita el "No hay canciones"
        $('#listaCola').append(`
            <li class="list-group-item bg-transparent text-light border-secondary d-flex justify-content-between align-items-center">
                <span><i class="ph ph-music-note text-neon"></i> ${titulo}</span>
                <span class="badge bg-info text-dark">En espera</span>
            </li>
        `);

        mostrarToast('¡Añadido a la cola!', titulo);
    });
});

// ==========================================
// MÓDULO 4: VALIDACIÓN DE RESERVA
// ==========================================
$(document).ready(function() {
    // Calculadora en tiempo real (50 BOB por hora)
    $('#horasReserva').on('input', function() {
        let hrs = $(this).val() || 1;
        if(hrs < 1) { hrs = 1; $(this).val(1); }
        if(hrs > 5) { hrs = 5; $(this).val(5); }
        $('#totalPagar').text(hrs * 50);
    });

    $('#formReserva').on('submit', function(e) {
        e.preventDefault();
        let nombre = $('#nombreReserva').val().trim();
        let valido = true;

        // Validación en tiempo real (Alerta)
        if(nombre.length < 3) {
            $('#nombreReserva').addClass('is-invalid border-danger');
            $('#errorNombre').removeClass('d-none');
            valido = false;
        } else {
            $('#nombreReserva').removeClass('is-invalid border-danger').addClass('border-info');
            $('#errorNombre').addClass('d-none');
        }

        if(valido) {
            mostrarToast('¡Reserva Exitosa!', nombre + ', tu sala está lista.');
            $('#formReserva')[0].reset();
            $('#totalPagar').text('50'); // Resetea el total
        }
    });

    // Quitar error al escribir
    $('#nombreReserva').on('input', function() {
        if($(this).val().trim().length >= 3) {
            $(this).removeClass('is-invalid border-danger').addClass('border-info');
            $('#errorNombre').addClass('d-none');
        }
    });
});

// ==========================================
// MÓDULO 5: UTILIDADES Y HIDRATACIÓN
// ==========================================
function mostrarToast(titulo, mensaje) {
    $('#toastTitulo').text(titulo);
    $('#toastMensaje').text(mensaje);
    $('#toast').fadeIn('fast');
    setTimeout(() => $('#toast').fadeOut('slow'), 3000);
}

$(document).ready(function() {
    $('#hydrateBtn').on('click', function() {
        let $btn = $(this);
        $btn.html('<i class="ph ph-spinner-gap" style="animation: spin 1s linear infinite;"></i> Hidratando...');
        setTimeout(() => {
            $btn.html('<i class="ph ph-check-circle"></i> Hidratado');
            mostrarToast('Sistema Hidratado', 'Listeners de memoria limpios.');
        }, 1000);
    });
});

// ==========================================
// REGISTRO PWA
// ==========================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW Error', err));
    });
}
