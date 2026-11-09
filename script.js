$(document).ready(function() {
    // 1. Acordeón (Jueves)
    $('.accordion-btn').click(function() {
        $(this).next('.accordion-panel').slideToggle('fast');
        $(this).find('i').toggleClass('ph-caret-down ph-caret-up');
    });

    // 2. Filtro de Tabs (Jueves)
    $('.tab-btn').click(function() {
        $('.tab-btn').removeClass('active');
        $(this).addClass('active');

        let target = $(this).data('target');
        $('.card-item').removeClass('active').hide();
        $('.' + target).addClass('active').fadeIn('slow');
    });

    // 3. Calculadora en Tiempo Real (Viernes)
    $('#horas').on('input', function() {
        let hrs = $(this).val() || 1;
        if(hrs < 1) { hrs = 1; $(this).val(1); }
        $('#total').text(hrs * 40);
    });

    // 4. Modal y Temporizador Asíncrono (Viernes + Reto)
    let timerInterval;
    const modalElement = document.getElementById('modalReserva');
    const modal = new bootstrap.Modal(modalElement);

    $('#btnReservar').click(function() {
        // Setear total en el modal
        $('#modalTotal').text($('#total').text() + ' BOB');
        modal.show();

        // Iniciar temporizador
        let timeLeft = 30;
        $('#timer').text('00:30').removeClass('text-danger');

        clearInterval(timerInterval); // Prevenir múltiples intervalos

        timerInterval = setInterval(function() {
            timeLeft--;
            let m = Math.floor(timeLeft / 60);
            let s = timeLeft % 60;
            $('#timer').text(`0${m}:${s < 10 ? '0' : ''}${s}`);

            // Efecto de urgencia en los últimos 10 segundos
            if(timeLeft <= 10) {
                $('#timer').addClass('text-danger');
            }

            // Expiración
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                modal.hide();
                alert('⏰ Tarifa Flash Expirada. Vuelve a intentarlo.');
            }
        }, 1000);
    });

    // 5. Cancelar Modal
    $('#btnCancelar, #btnCerrarModal').click(function() {
        clearInterval(timerInterval);
        modal.hide();
    });

    // 6. Confirmar Pago y Mostrar Toast
    $('#btnPagar').click(function() {
        clearInterval(timerInterval);
        modal.hide();

        // Mostrar Toast con jQuery (Reto Nivel PRO)
        $('#toastAlert').slideDown('fast');
        setTimeout(function() {
            $('#toastAlert').fadeOut('slow');
        }, 3000); // Se oculta a los 3 segundos
    });

    // Limpiar intervalo si el modal se cierra por fuera
    modalElement.addEventListener('hidden.bs.modal', function () {
        clearInterval(timerInterval);
    });
});
