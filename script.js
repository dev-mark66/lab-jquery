// ==========================================
// 1. REGISTRO PWA Y ACTUALIZACIÓN
// ==========================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => {
                reg.onupdatefound = () => {
                    const installingWorker = reg.installing;
                    installingWorker.onstatechange = () => {
                        if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            window.location.reload();
                        }
                    };
                };
            }).catch(err => console.log('Error SW:', err));
    });
}

// ==========================================
// 2. NAVEGACIÓN (TABS SIN SCROLL)
// ==========================================
$(document).ready(function() {
    $('.nav-item').on('click', function(e) {
        e.preventDefault();
        $('.nav-item').removeClass('active');
        $(this).addClass('active');

        let target = $(this).data('target');
        $('.app-view').removeClass('active');
        $('#' + target).addClass('active');
    });
});

// ==========================================
// 3. CARGA DE DATOS (PISTAS, SNACKS, BEBIDAS)
// ==========================================
let pistasSeleccionadas = 0;
let extrasSeleccionados = 0;

$(document).ready(function() {
    fetch('data/productos.json')
        .then(res => res.json())
        .then(data => {
            // Renderizar Pistas
            let htmlPistas = '';
            data.pistas.forEach(item => {
                htmlPistas += `
                <article class="tarjeta-pista" data-tipo="pista" data-id="${item.id}" data-titulo="${item.titulo}" data-artista="${item.artista}" data-hd="${item.portada_hd}" data-letra="${item.letra}">
                    <img src="${item.portada}" loading="lazy" class="img-portada">
                    <div class="info-pista"><h4>${item.titulo}</h4><p>${item.artista}</p></div>
                    <i class="ph ph-caret-right text-muted"></i>
                </article>`;
            });
            $('#catalogoKaraoke').html(htmlPistas);

            // Renderizar Snacks
            let htmlSnacks = '';
            data.snacks.forEach(item => {
                htmlSnacks += `
                <article class="tarjeta-pista">
                    <img src="${item.portada}" loading="lazy" class="img-portada">
                    <div class="info-pista"><h4>${item.titulo}</h4><p>${item.precio} BOB</p></div>
                    <button class="btn-add btn-add-extra" data-nombre="${item.titulo}"><i class="ph ph-plus"></i></button>
                </article>`;
            });
            $('#catalogoSnacks').html(htmlSnacks);

            // Renderizar Bebidas
            let htmlBebidas = '';
            data.bebidas.forEach(item => {
                htmlBebidas += `
                <article class="tarjeta-pista">
                    <img src="${item.portada}" loading="lazy" class="img-portada">
                    <div class="info-pista"><h4>${item.titulo}</h4><p>${item.precio} BOB</p></div>
                    <button class="btn-add btn-add-extra" data-nombre="${item.titulo}"><i class="ph ph-plus"></i></button>
                </article>`;
            });
            $('#catalogoBebidas').html(htmlBebidas);
        })
        .catch(err => console.log('Error cargando JSON:', err));
});

// ==========================================
// 4. MODAL DE PISTAS Y LETRA
// ==========================================
$(document).ready(function() {
    $(document).off('click', '.tarjeta-pista[data-tipo="pista"]').on('click', '.tarjeta-pista[data-tipo="pista"]', function() {
        $('#pistaTitulo').text($(this).data('titulo'));
        $('#pistaArtista').text($(this).data('artista'));
        $('#pistaLetra').html($(this).data('letra').split('\n').join('<br><br>'));
        $('#pistaImgHD').attr('src', $(this).data('hd'));

        $('#btnAgregarDesdeModal').off('click').on('click', function() {
            pistasSeleccionadas++;
            $('#countPistas').text(pistasSeleccionadas);
            mostrarToast('¡Agregada!', 'Pista sumada a tu reserva.');
            $('#modalPista').modal('hide');
        });

        new bootstrap.Modal(document.getElementById('modalPista')).show();
    });
});

// ==========================================
// 5. AGREGAR EXTRAS (SNACKS Y BEBIDAS)
// ==========================================
$(document).ready(function() {
    $(document).off('click', '.btn-add-extra').on('click', '.btn-add-extra', function(e) {
        e.stopPropagation();
        extrasSeleccionados++;
        $('#countExtras').text(extrasSeleccionados);
        mostrarToast('¡Agregado!', $(this).data('nombre') + ' sumado a tu reserva.');

        // Efecto visual
        let $btn = $(this);
        $btn.html('<i class="ph ph-check"></i>').removeClass('btn-add-extra').addClass('bg-success text-white').css('border-color', '#10b981');
    });
});

// ==========================================
// 6. FORMULARIO Y PREVENCIÓN XSS (PDF)
// ==========================================
$(document).ready(function() {
    $('#formReserva').off('submit').on('submit', function(e) {
        e.preventDefault();

        let nombre = $('#clienteNombre').val().trim();
        let sala = $('#salaSelect').val();
        let valido = true;

        // Validar Nombre
        if(!nombre) {
            $('#clienteNombre').addClass('is-invalid');
            $('#errorNombre').removeClass('d-none');
            valido = false;
        } else {
            $('#clienteNombre').removeClass('is-invalid');
            $('#errorNombre').addClass('d-none');
        }

        // Validar que haya al menos una pista
        if(pistasSeleccionadas === 0) {
            mostrarToast('Atención', 'Debes elegir al menos 1 pista en el menú inferior.');
            valido = false;
            // Mandar al usuario a la pestaña de pistas si se equivocó
            $('.nav-item[data-target="view-pistas"]').click();
        }

        if(!valido) return;

        // PREVENCIÓN XSS (Se usa .text() en lugar de HTML)
        mostrarToast('¡Reserva Exitosa!', 'Tu ' + sala + ' está confirmada.');

        // Resetear app
        this.reset();
        pistasSeleccionadas = 0;
        extrasSeleccionados = 0;
        $('#countPistas').text('0');
        $('#countExtras').text('0');
        $('.nav-item[data-target="view-reserva"]').click();
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
    setTimeout(() => $('#toast').fadeOut('slow'), 3000);
}
