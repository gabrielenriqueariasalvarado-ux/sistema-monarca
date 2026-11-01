import sys

sys.stdout.reconfigure(encoding='utf-8')

extra_dark_rules = """

/* ==========================================================================
   COBERTURA COMPLETA TOTAL DARK: COMPONENTES ESPECÍFICOS DE TODAS LAS VISTAS
   ========================================================================== */

.inventario-kpi-card, .stretch-active-card, .sheet-sync-box, .operatividad-header {
    background: #121725 !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    color: #f8fafc !important;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 4px 16px rgba(0, 0, 0, 0.4) !important;
}

.inventario-kpi-card:hover, .stretch-active-card:hover {
    border-color: rgba(99, 102, 241, 0.4) !important;
    background: #161c2d !important;
}

.quest-item {
    background: #121725 !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    color: #f8fafc !important;
}

.quest-item:hover {
    border-color: rgba(99, 102, 241, 0.4) !important;
    background: #161c2d !important;
}

/* Modales e inputs */
.modal-system-window input, .modal-system-window select, .modal-system-window textarea {
    background: #0b0e15 !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    color: #f8fafc !important;
}

.modal-system-window input:focus, .modal-system-window select:focus, .modal-system-window textarea:focus {
    border-color: #6366f1 !important;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2) !important;
}

/* Prevenir cualquier contenedor blanco hijo dentro de tarjetas */
.card > div[style*="background: #ffffff"], 
.card > div[style*="background:#ffffff"],
.card > div[style*="background: white"] {
    background: #121725 !important;
    border-color: rgba(255, 255, 255, 0.08) !important;
    color: #f8fafc !important;
}

/* Forzar que todos los textos negros o grises oscuros dentro de tarjetas sean legibles */
.card h1, .card h2, .card h3, .card h4, .card h5, .card h6 {
    color: #f8fafc !important;
}

.card span[style*="color: #111827"],
.card span[style*="color:#111827"],
.card p[style*="color: #111827"],
.card div[style*="color: #111827"] {
    color: #f8fafc !important;
}
"""

with open('style.css', 'r', encoding='utf-8') as f:
    css = f.read()

if "COBERTURA COMPLETA TOTAL DARK" not in css:
    with open('style.css', 'w', encoding='utf-8') as f:
        f.write(css + extra_dark_rules)
    print("✓ Reglas extra de cobertura total añadidas a style.css!")
else:
    print("ℹ Las reglas extra ya estaban presentes.")
