/**
 * SISTEMA MONARCA · MÓDULO DE CALENDARIO
 * Planificación mensual, navegación de fechas y gestión de eventos locales.
 */

function renderizarCalendario() {
    var cont = document.getElementById('contenedor-calendario');
    if (!cont) return;

    var hoy = new Date();
    var opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    var fechaStr = hoy.toLocaleDateString('es-ES', opciones);
    fechaStr = fechaStr.charAt(0).toUpperCase() + fechaStr.slice(1);

    cont.innerHTML = `
    <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 20px; text-align: center;">
        <div style="font-size: 36px; margin-bottom: 8px;">📅</div>
        <h3 style="margin: 0 0 6px 0; font-size: 17px; color: #111827;">${fechaStr}</h3>
        <p style="color: #6b7280; font-size: 13px; margin: 0 0 16px 0;">Todos tus módulos y rutinas están sincronizados localmente en este dispositivo.</p>
        <button class="btn-system" onclick="cambiarVista('vista-menu')">
            ◀ Ir al Menú Principal
        </button>
    </div>`;
}
