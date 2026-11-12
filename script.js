$(document).ready(function() {

    // 1. Consumo asíncrono con Fetch API nativo y Lazy Loading
    fetch('data/canciones.json')
        .then(response => {
            // Validación manual de errores HTTP (404, 500) como pide el PDF
            if (!response.ok) throw new Error('Error HTTP: ' + response.status);
            return response.json();
        })
        .then(canciones => {
            let html = '';
            canciones.forEach(item => {
                // Uso de loading="lazy" en imágenes y clases limpias
                html += `
                <article class="tarjeta-pista" data-id="${item.id}">
                    <img src="${item.portada}" alt="${item.titulo}" loading="lazy" width="64" height="64">
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
            $('#catalogoKaraoke').html('<p class="text-danger">Error al cargar el repertorio. Revisa tu conexión.</p>');
        });

    // 2. Delegación de eventos por Event Bubbling (Ahorro de RAM)
    // PRÁCTICA CORRECTA: .off() antes de .on() para evitar Memory Leaks
    $('#catalogoKaraoke').off('click', '.btn-agregar-cola').on('click', '.btn-agregar-cola', function() {
        let idPista = $(this).closest('.tarjeta-pista').data('id');
        let titulo = $(this).closest('.tarjeta-pista').find('h4').text();

        // Mostrar notificación Toast
        $('#toast').find('strong').text('¡' + titulo + ' añadida!');
        $('#toast').fadeIn('fast');
        setTimeout(() => $('#toast').fadeOut('slow'), 3000);
    });

    // 3. Detector de Red (Opcional para la PWA)
    function actualizarEstadoRed() {
        if (navigator.onLine) {
            $('#estadoRed').text('🟢 En Línea').removeClass('bg-warning text-dark').addClass('bg-success');
        } else {
            $('#estadoRed').text('🟠 Offline').removeClass('bg-success').addClass('bg-warning text-dark');
        }
    }
    $(window).on('online offline', actualizarEstadoRed);
    actualizarEstadoRed();

    // 4. Botón de Hidratación (Simulación SSR del otro PDF)
    $('#hydrateBtn').on('click', function() {
        let $btn = $(this);
        $btn.html('<i class="ph ph-spinner-gap" style="animation: spin 1s linear infinite;"></i> Hidratando...');
        setTimeout(() => {
            $btn.html('<i class="ph ph-check-circle"></i> Hidratado');
            $('#toast').find('strong').text('App Hidratada');
            $('#toast').fadeIn('fast');
            setTimeout(() => $('#toast').fadeOut('slow'), 2000);
        }, 1000);
    });
});

// ==========================================
// REGISTRO DEL SERVICE WORKER (PWA)
// ==========================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log('✅ SW Karaoke registrado'))
            .catch(err => console.log('❌ Error SW:', err));
    });
}
