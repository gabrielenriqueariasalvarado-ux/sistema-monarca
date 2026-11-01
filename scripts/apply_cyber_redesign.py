import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

print("=== INICIANDO REDISEÑO VISUAL EJECUTIVO / CYBERNETIC OS (SISTEMA MONARCA) ===")

# ==============================================================================
# 1. ACTUALIZAR STYLE.CSS
# ==============================================================================
with open('style.css', 'r', encoding='utf-8') as f:
    style_content = f.read()

# Reemplazar la cabecera y el diseño base inicial hasta .monto-negativo
split_marker = ".monto-negativo {"
if split_marker not in style_content:
    print("ERROR: No se encontró split_marker en style.css")
    sys.exit(1)

parts = style_content.split(split_marker, 1)

new_base_css = """/* ==========================================================================
   SISTEMA MONARCA · CYBERNETIC BIO-TELEMETRY & EXECUTIVE OS
   Diseño de Alta Fidelidad: Estilo PaceFuel / Huly / Dark Modern Precision
   ========================================================================== */

:root {
    --bg-page: #080a0f;
    --card-bg: #0f131d;
    --card-bg-elevated: #141926;
    --card-bg-subtle: rgba(255, 255, 255, 0.025);
    --card-bg-hover: #131826;
    --card-border: rgba(255, 255, 255, 0.08);
    --card-border-hover: rgba(99, 102, 241, 0.4);
    --card-border-accent: rgba(99, 102, 241, 0.5);
    --card-radius: 16px;
    --card-radius-lg: 20px;
    --card-radius-pill: 9999px;
    
    /* Sombras por capas oscuras y specular highlights */
    --shadow-subtle: 0 1px 2px 0 rgba(0, 0, 0, 0.4);
    --shadow-card: inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 4px 20px -2px rgba(0, 0, 0, 0.6);
    --shadow-hover: inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 14px 32px -4px rgba(0, 0, 0, 0.8), 0 0 24px -4px rgba(99, 102, 241, 0.2);
    --shadow-active: inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 2px 8px rgba(0, 0, 0, 0.6);
    
    /* Tipografía y Textos */
    --text-primary: #f8fafc;
    --text-secondary: #94a3b8;
    --text-muted: #64748b;
    --text-accent: #818cf8;
    
    /* Acentos de Color */
    --accent-indigo: #6366f1;
    --accent-cyan: #38bdf8;
    --accent-emerald: #10b981;
    --accent-amber: #f59e0b;
    --accent-rose: #f43f5e;
    
    /* Controles e Inputs */
    --input-bg: #0b0e15;
    --input-border: rgba(255, 255, 255, 0.1);
    --input-border-focus: #6366f1;
    
    /* Curvas de aceleración naturales */
    --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
    --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}

* {
    box-sizing: border-box;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

body {
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background-color: var(--bg-page);
    background-image: 
        radial-gradient(ellipse 80% 50% at 50% -20%, rgba(56, 189, 248, 0.08), rgba(99, 102, 241, 0.05), transparent 70%),
        radial-gradient(circle at 100% 100%, rgba(30, 41, 59, 0.25) 0%, transparent 60%);
    background-attachment: fixed;
    color: var(--text-primary);
    margin: 0;
    padding: 24px 18px 96px 18px;
    min-height: 100vh;
    user-select: none;
    letter-spacing: -0.01em;
}

button, input, select, textarea {
    font-family: inherit;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

button {
    cursor: pointer;
    border-radius: var(--card-radius-pill);
    border: 1px solid var(--card-border);
    background: #111522;
    color: var(--text-primary);
    font-weight: 600;
    transition: all 0.2s var(--ease-out);
    outline: none;
    -webkit-tap-highlight-color: transparent;
}

button:hover {
    border-color: var(--card-border-hover);
    background: #161c2e;
}

button:active {
    transform: scale(0.98);
}

.container {
    max-width: 880px;
    margin: 0 auto;
    padding-bottom: 50px;
}

/* Títulos Principales con Jerarquía Clara */
h1 {
    color: var(--text-primary);
    text-align: center;
    margin-bottom: 24px;
    font-size: 22px;
    font-weight: 800;
    letter-spacing: -0.03em;
}

h2 {
    color: var(--text-primary);
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.025em;
    margin-top: 0;
}

h3 {
    color: #f1f5f9;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: -0.02em;
}

p {
    color: var(--text-secondary);
    font-size: 13.5px;
    line-height: 1.55;
    letter-spacing: -0.01em;
}

/* Vistas y Pestañas con Transición Suave */
.tab-content {
    display: none;
    animation: fadeIn 0.22s var(--ease-out);
}

.tab-content.active {
    display: block;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
}

/* Tarjetas y Contenedores */
.card {
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: var(--card-radius);
    padding: 24px;
    margin-bottom: 20px;
    box-shadow: var(--shadow-card);
    transition: transform 0.22s var(--ease-out), box-shadow 0.22s var(--ease-out), border-color 0.2s ease;
    color: var(--text-primary);
}

.card:hover {
    border-color: var(--card-border-hover);
    box-shadow: var(--shadow-hover);
}

/* Banner Destacado / Telemetry Hero */
.user-header-card {
    background: linear-gradient(145deg, #121725 0%, #0c1018 100%);
    color: #ffffff;
    border-radius: var(--card-radius-lg);
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 12px 30px -4px rgba(0, 0, 0, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.09);
    position: relative;
    overflow: hidden;
}

.user-header-card::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 250px;
    height: 100%;
    background: radial-gradient(circle at 100% 0%, rgba(99, 102, 241, 0.15), transparent 70%);
    pointer-events: none;
}

.user-header-card h2 {
    color: #ffffff !important;
    margin: 0 0 6px 0;
    font-size: 20px;
    font-weight: 800;
    letter-spacing: -0.03em;
}

.user-header-card p {
    color: #94a3b8 !important;
    margin: 0;
    font-size: 13px;
    font-weight: 500;
}

/* Menú en Cuadrícula - Bento Grid */
.grid-menu {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 16px;
    margin-top: 18px;
}

@media (max-width: 600px) {
    .grid-menu {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
    }
}

@media (max-width: 360px) {
    .grid-menu {
        grid-template-columns: 1fr;
    }
}

/* Tarjetas de Menú - Estilo PaceFuel / Huly Precision */
.menu-card {
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: var(--card-radius);
    padding: 18px 16px;
    text-align: left;
    cursor: pointer;
    transition: transform 0.22s var(--ease-out), box-shadow 0.22s var(--ease-out), border-color 0.2s ease, background 0.2s ease;
    box-shadow: var(--shadow-card);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 140px;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    position: relative;
    overflow: hidden;
}

.menu-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
    opacity: 0;
    transition: opacity 0.2s ease;
}

.menu-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-hover);
    border-color: var(--card-border-hover);
    background: var(--card-bg-hover);
}

.menu-card:hover::before {
    opacity: 1;
}

.menu-card:active {
    transform: translateY(-1px) scale(0.985);
    box-shadow: var(--shadow-active);
}

.menu-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
}

.menu-card .menu-icon {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #cbd5e1;
    transition: all 0.22s var(--ease-out);
}

.menu-card:hover .menu-icon {
    transform: scale(1.08);
    background: rgba(99, 102, 241, 0.16);
    border-color: rgba(99, 102, 241, 0.45);
    color: #818cf8;
    box-shadow: 0 0 16px rgba(99, 102, 241, 0.25);
}

.menu-card .menu-badge {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-muted);
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 6px;
    padding: 3px 8px;
    transition: all 0.2s ease;
}

.menu-card:hover .menu-badge {
    color: #818cf8;
    border-color: rgba(99, 102, 241, 0.3);
    background: rgba(99, 102, 241, 0.08);
}

.menu-card h3 {
    color: var(--text-primary);
    margin: 0 0 4px 0;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: -0.02em;
}

.menu-card p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 12px;
    line-height: 1.45;
    font-weight: 400;
}

.menu-card-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-top: 10px;
}

.menu-card-arrow {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    gap: 4px;
    transition: all 0.2s ease;
    opacity: 0.7;
}

.menu-card:hover .menu-card-arrow {
    color: #818cf8;
    opacity: 1;
    transform: translateX(3px);
}

/* Botones Modernos Estilo Píldora */
.btn-system {
    background: linear-gradient(180deg, #1e2538 0%, #131927 100%);
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.14);
    padding: 10px 22px;
    border-radius: var(--card-radius-pill);
    cursor: pointer;
    font-weight: 600;
    font-size: 13px;
    letter-spacing: -0.01em;
    transition: all 0.2s var(--ease-out);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 2px 8px rgba(0, 0, 0, 0.4);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    -webkit-tap-highlight-color: transparent;
}

.btn-system:hover:not(:disabled) {
    background: linear-gradient(180deg, #27324c 0%, #1a2235 100%);
    border-color: rgba(99, 102, 241, 0.5);
    box-shadow: 0 0 16px rgba(99, 102, 241, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
}

.btn-system:active:not(:disabled) {
    transform: translateY(0px) scale(0.98);
}

.btn-system:disabled {
    background: #161b26 !important;
    color: #475569 !important;
    border-color: rgba(255, 255, 255, 0.06) !important;
    cursor: not-allowed !important;
    box-shadow: none !important;
}

.btn-back-system {
    background: #111522;
    color: #e2e8f0;
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 8px 18px;
    border-radius: var(--card-radius-pill);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 20px;
    transition: all 0.2s var(--ease-out);
    box-shadow: var(--shadow-subtle);
}

.btn-back-system:hover {
    background: #161c2e;
    border-color: rgba(99, 102, 241, 0.4);
    color: #ffffff;
    transform: translateY(-2px);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5);
}

.btn-back-system:active {
    transform: translateY(0) scale(0.98);
}

/* Tablas Limpias */
table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
}

th {
    background-color: #121725;
    color: var(--text-muted);
    padding: 12px 14px;
    text-align: left;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    font-size: 11px;
    text-transform: uppercase;
    font-weight: 700;
    letter-spacing: 0.06em;
}

td {
    padding: 12px 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    color: #e2e8f0;
    font-size: 13.5px;
}

tr:hover td {
    background-color: rgba(255, 255, 255, 0.025);
}

/* Formularios e Inputs con acabado limpio */
input[type="text"], input[type="number"], input[type="date"], input[type="time"], select, textarea {
    width: 100%;
    padding: 11px 15px;
    background-color: var(--input-bg);
    border: 1px solid var(--input-border);
    border-radius: 12px;
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 10px;
    outline: none;
    transition: all 0.2s var(--ease-out);
}

input[type="text"]:focus, input[type="number"]:focus, input[type="date"]:focus, input[type="time"]:focus, select:focus, textarea:focus {
    background-color: #0e121a;
    border-color: var(--accent-indigo);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

/* Modales con Glassmorphism Suave y Curva Natural */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(4, 6, 11, 0.78);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 16px;
}

.modal-system-window {
    background: #0f131d;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: var(--card-radius-lg);
    width: 100%;
    max-width: 480px;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 25px 60px -12px rgba(0, 0, 0, 0.85);
    overflow: hidden;
    animation: modalScale 0.28s var(--ease-out);
    color: var(--text-primary);
}

@keyframes modalScale {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
}

.modal-system-header {
    padding: 18px 22px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #131826;
}

.modal-system-header span {
    color: #f8fafc !important;
    font-weight: 700;
    font-size: 14px;
    letter-spacing: -0.2px;
}

.modal-close-btn {
    background: rgba(255, 255, 255, 0.06);
    border: none;
    color: #94a3b8;
    font-size: 18px;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.modal-close-btn:hover {
    background: rgba(255, 255, 255, 0.12);
    color: #ffffff;
}

.modal-form-group {
    margin-bottom: 16px;
}

.modal-form-group label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: 6px;
}

.modal-input {
    width: 100%;
    background-color: var(--input-bg);
    border: 1px solid var(--input-border);
    border-radius: 12px;
    padding: 10px 14px;
    color: var(--text-primary);
    font-size: 14px;
    outline: none;
    transition: all 0.2s;
}

.modal-input:focus {
    background-color: #0e121a;
    border-color: var(--accent-indigo);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

/* ==========================================================================
   CONTROL FINANCIERO PERSONAL (SERIO & PROFESIONAL)
   ========================================================================== */

.finanzas-header-card {
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: 16px;
    padding: 22px;
    margin-bottom: 22px;
    box-shadow: var(--shadow-card);
    transition: transform 0.22s var(--ease-out), box-shadow 0.22s var(--ease-out);
}

.finanzas-meta-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-bottom: 14px;
}

@media (max-width: 600px) {
    .finanzas-meta-row {
        grid-template-columns: 1fr;
    }
}

.finanzas-field-label {
    font-size: 11px;
    color: var(--text-muted);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 6px;
    display: block;
}

.finanzas-input-clean {
    width: 100%;
    background-color: var(--input-bg);
    border: 1px solid var(--input-border);
    border-radius: 12px;
    padding: 10px 14px;
    color: var(--text-primary);
    font-size: 13.5px;
    outline: none;
    transition: all 0.2s;
}

.finanzas-input-clean:focus {
    background-color: #0e121a;
    border-color: var(--accent-indigo);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

.finanzas-section-card {
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: 20px;
    padding: 22px;
    margin-bottom: 22px;
    box-shadow: var(--shadow-card);
}

.finanzas-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding-bottom: 12px;
}

.finanzas-section-title {
    color: var(--text-primary);
    font-size: 15px;
    font-weight: 700;
    letter-spacing: -0.2px;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
}

.btn-add-finanza {
    background: linear-gradient(180deg, #1e2538 0%, #131927 100%);
    border: 1px solid rgba(255, 255, 255, 0.14);
    color: #ffffff;
    padding: 7px 16px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s ease;
}

.btn-add-finanza:hover {
    background: linear-gradient(180deg, #27324c 0%, #1a2235 100%);
    border-color: rgba(99, 102, 241, 0.5);
    transform: translateY(-1px);
    box-shadow: 0 0 12px rgba(99, 102, 241, 0.25);
}

.table-finanzas-wrapper {
    overflow-x: auto;
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: var(--card-bg);
}

.table-finanzas {
    width: 100%;
    border-collapse: collapse;
    margin-top: 0;
}

.table-finanzas th {
    background-color: #121725;
    color: var(--text-muted);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    padding: 12px 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.table-finanzas td {
    padding: 12px 14px;
    font-size: 13.5px;
    color: #e2e8f0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.table-finanzas tr:hover td {
    background-color: rgba(255, 255, 255, 0.025);
}

.monto-positivo {
    color: #34d399;
    font-weight: 700;
    text-shadow: 0 0 10px rgba(52, 211, 153, 0.25);
}

"""

new_style_css = new_base_css + split_marker + parts[1]

# Overrides cybernetic executive at the end of style.css
overrides_css = """

/* ==========================================================================
   SISTEMA MONARCA · CYBERNETIC OS SUITE OVERRIDES (PACEFUEL / HULY)
   ========================================================================== */

/* CABECERA SUPERIOR MODERNA / TOP NAV BAR */
.monarca-top-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
    padding: 0 4px;
    flex-wrap: wrap;
    gap: 12px;
}

.monarca-brand-container {
    display: flex;
    align-items: center;
    gap: 12px;
}

.monarca-brand-mark {
    width: 42px;
    height: 42px;
    background: linear-gradient(145deg, #171d2c 0%, #0c1018 100%);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #818cf8;
    font-weight: 800;
    font-size: 19px;
    border: 1px solid rgba(99, 102, 241, 0.35);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 0 16px rgba(99, 102, 241, 0.2);
}

.monarca-brand-title {
    margin: 0;
    text-align: left;
    font-size: 18px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #f8fafc;
}

.monarca-brand-subtitle {
    margin: 0;
    font-size: 11px;
    color: var(--text-muted);
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

.monarca-top-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}

.user-pill-badge {
    font-size: 12px;
    font-weight: 600;
    padding: 6px 14px;
    background: #0f131d;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 9999px;
    color: #e2e8f0;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 2px 6px rgba(0, 0, 0, 0.4);
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.user-pill-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #38bdf8;
    box-shadow: 0 0 8px rgba(56, 189, 248, 0.6);
}

/* CLOUD SYNC BADGE DARK */
.cloud-sync-badge {
    background: #0f131d !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    color: #94a3b8 !important;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 2px 6px rgba(0, 0, 0, 0.4) !important;
}

.cloud-sync-badge:hover {
    border-color: rgba(99, 102, 241, 0.4) !important;
    background: #141926 !important;
    color: #f8fafc !important;
}

.cloud-sync-badge.status-synced {
    border-color: rgba(16, 185, 129, 0.35) !important;
    color: #f8fafc !important;
}

.cloud-sync-badge.status-synced .cloud-sync-dot {
    background: #10b981 !important;
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.6) !important;
}

/* FLOATING BOTTOM HUD BAR (PACEFUEL / HULY EXECUTIVE STYLE) */
.monarca-bottom-hud {
    position: fixed;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(15, 19, 29, 0.92);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 9999px;
    padding: 6px 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 16px 36px -4px rgba(0, 0, 0, 0.85);
    z-index: 9500;
    transition: all 0.25s var(--ease-out);
}

.bottom-hud-item {
    background: transparent;
    border: none;
    color: #94a3b8;
    padding: 8px 14px;
    border-radius: 9999px;
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s var(--ease-out);
    white-space: nowrap;
}

.bottom-hud-item svg {
    display: block;
    stroke: currentColor;
    transition: transform 0.2s var(--ease-out), stroke 0.2s;
}

.bottom-hud-item:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.08);
}

.bottom-hud-item:hover svg {
    transform: translateY(-2px);
    stroke: #818cf8;
}

.bottom-hud-item.active {
    background: rgba(99, 102, 241, 0.18);
    color: #ffffff;
    border: 1px solid rgba(99, 102, 241, 0.35);
    box-shadow: 0 0 12px rgba(99, 102, 241, 0.2);
}

.bottom-hud-item.active svg {
    stroke: #818cf8;
}

@media (max-width: 540px) {
    .monarca-bottom-hud {
        width: calc(100% - 24px);
        max-width: 420px;
        justify-content: space-around;
        padding: 5px 6px;
        gap: 2px;
        bottom: 12px;
    }
    .bottom-hud-item span {
        display: none;
    }
    .bottom-hud-item {
        padding: 9px 12px;
    }
}

/* REPOSICIONAMIENTO DE ACCIONES FLOTANTES (ENCIMA DEL HUD BAR) */
#btn-jarvis-voz-flotante {
    bottom: 82px !important;
    right: 18px !important;
    background: #0f131d !important;
    border: 1px solid rgba(255, 255, 255, 0.14) !important;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 8px 24px rgba(0, 0, 0, 0.6) !important;
}

#btn-jarvis-voz-flotante:hover {
    background: #141926 !important;
    border-color: rgba(99, 102, 241, 0.5) !important;
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.3) !important;
}

#btn-asistente-flotante {
    bottom: 138px !important;
    right: 18px !important;
    background: #0f131d !important;
    border: 1px solid rgba(255, 255, 255, 0.14) !important;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 8px 24px rgba(0, 0, 0, 0.6) !important;
}

#btn-asistente-flotante:hover {
    background: #141926 !important;
    border-color: rgba(56, 189, 248, 0.5) !important;
    box-shadow: 0 0 20px rgba(56, 189, 248, 0.3) !important;
}

/* QUESTS & DISCIPLINA DARK HUD */
.quest-hud-metric {
    background: var(--card-bg-elevated) !important;
    border: 1px solid var(--card-border) !important;
    box-shadow: var(--shadow-card) !important;
}

.quest-hud-metric:hover {
    border-color: var(--card-border-hover) !important;
    box-shadow: var(--shadow-hover) !important;
}

.quest-diario-card {
    background: var(--card-bg-elevated) !important;
    border: 1px solid var(--card-border) !important;
    border-left: 4px solid #6366f1 !important;
    box-shadow: var(--shadow-card) !important;
}

.quest-diario-card:hover {
    border-color: var(--card-border-hover) !important;
    box-shadow: var(--shadow-hover) !important;
}

.quest-diario-card.en-progreso {
    border-left-color: #38bdf8 !important;
    background: #111726 !important;
}

.quest-diario-card.completada {
    border-left-color: #10b981 !important;
    background: rgba(16, 185, 129, 0.08) !important;
}

.quest-diario-card.penitencia-saldada {
    border-left-color: #64748b !important;
    background: #0f131d !important;
    opacity: 0.75 !important;
}

.quest-diario-card.penalizada {
    border-left-color: #ef4444 !important;
    background: rgba(239, 68, 68, 0.08) !important;
    border-color: rgba(239, 68, 68, 0.4) !important;
}

.qd-category-badge {
    background: rgba(255, 255, 255, 0.05) !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    color: #cbd5e1 !important;
}

.tab-category-pill, .training-tab-btn {
    background: #111624 !important;
    color: #94a3b8 !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
}

.tab-category-pill:hover, .training-tab-btn:hover {
    background: #161c2e !important;
    color: #ffffff !important;
    border-color: rgba(255, 255, 255, 0.15) !important;
}

.tab-category-pill.active, .training-tab-btn.active {
    background: linear-gradient(180deg, #1e263a 0%, #131928 100%) !important;
    color: #ffffff !important;
    border-color: rgba(99, 102, 241, 0.5) !important;
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15) !important;
}

.btn-subfiltro-ej {
    background: #111624 !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    color: #94a3b8 !important;
}

.btn-subfiltro-ej:hover {
    border-color: rgba(99, 102, 241, 0.4) !important;
    background: #161c2e !important;
    color: #ffffff !important;
}

.btn-subfiltro-ej.active {
    background: #6366f1 !important;
    color: #ffffff !important;
    border-color: #6366f1 !important;
    box-shadow: 0 0 12px rgba(99, 102, 241, 0.3) !important;
}

/* BIO-TELEMETRÍA HEATMAP / PACFUEL SILHOUETTE */
.heatmap-dashboard-card {
    background: var(--card-bg) !important;
    border: 1px solid var(--card-border) !important;
    box-shadow: var(--shadow-card) !important;
}

.body-diagram-box {
    background: #07090e !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.8) !important;
}

.hud-muscle-card {
    background: var(--card-bg-elevated) !important;
    border: 1px solid var(--card-border) !important;
    border-left: 4px solid var(--accent-indigo) !important;
}

.hud-muscle-title {
    color: #f8fafc !important;
}

.hud-fatigue-big {
    color: #f8fafc !important;
}

.hud-recovery-tip {
    background: #0c1018 !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    color: var(--text-secondary) !important;
}

.hud-chip {
    background: #0f131d !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    color: var(--text-secondary) !important;
}

.hud-chip:hover {
    background: #161c2e !important;
    border-color: rgba(99, 102, 241, 0.4) !important;
    color: #ffffff !important;
}

.hud-chip.active {
    background: var(--accent-indigo) !important;
    border-color: var(--accent-indigo) !important;
    color: #ffffff !important;
    box-shadow: 0 0 12px rgba(99, 102, 241, 0.4) !important;
}

.muscle-zone-path:hover,
.muscle-zone-path.active-hover {
    stroke: #38bdf8 !important;
    filter: drop-shadow(0 0 8px rgba(56, 189, 248, 0.7)) !important;
}

.muscle-zone-path.selected-muscle {
    stroke: #818cf8 !important;
    filter: drop-shadow(0 0 10px rgba(129, 140, 248, 0.8)) !important;
}

/* ANATOMÍA & MENTE CARDS */
.anatomia-block-card,
.mente-area-card {
    background: var(--card-bg-elevated) !important;
    border: 1px solid var(--card-border) !important;
    box-shadow: var(--shadow-card) !important;
}

.anatomia-block-card:hover,
.mente-area-card:hover {
    border-color: var(--card-border-hover) !important;
    box-shadow: var(--shadow-hover) !important;
}

.anatomia-block-header,
.mente-area-header {
    border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
}

.anatomia-block-title,
.mente-area-title {
    color: var(--text-primary) !important;
}

.anatomia-block-desc,
.mente-area-desc {
    color: var(--text-secondary) !important;
}

.anatomia-musculo-item,
.mente-attr-item {
    background: #0d111a !important;
    border: 1px solid rgba(255, 255, 255, 0.06) !important;
}

.anatomia-musculo-item:hover,
.mente-attr-item:hover {
    background: #131826 !important;
    border-color: rgba(99, 102, 241, 0.35) !important;
}

.item-name {
    color: var(--text-primary) !important;
}

.item-badge-pill {
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    background: rgba(255, 255, 255, 0.04) !important;
    color: #e2e8f0 !important;
}

.attr-progress-track {
    background: rgba(255, 255, 255, 0.08) !important;
}

.attr-progress-fill {
    background: linear-gradient(90deg, #6366f1, #38bdf8) !important;
    box-shadow: 0 0 10px rgba(56, 189, 248, 0.4) !important;
}

/* MISIONES & HÁBITOS */
.mision-card {
    background: var(--card-bg-elevated) !important;
    border: 1px solid var(--card-border) !important;
    color: var(--text-primary) !important;
}

.mision-card:hover {
    border-color: var(--card-border-hover) !important;
    box-shadow: var(--shadow-hover) !important;
}

.mision-card.completada {
    background: rgba(16, 185, 129, 0.06) !important;
    border-color: rgba(16, 185, 129, 0.25) !important;
}

.mision-frecuencia-badge {
    background: rgba(255, 255, 255, 0.05) !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    color: #cbd5e1 !important;
}

.btn-completar-mision {
    background: linear-gradient(180deg, #1e2538 0%, #131927 100%) !important;
    border: 1px solid rgba(255, 255, 255, 0.14) !important;
    color: #ffffff !important;
}

.btn-completar-mision:hover {
    background: linear-gradient(180deg, #27324c 0%, #1a2235 100%) !important;
    border-color: rgba(99, 102, 241, 0.5) !important;
}
"""

with open('style.css', 'w', encoding='utf-8') as f:
    f.write(new_style_css + overrides_css)

print("✓ style.css actualizado con éxito.")

# ==============================================================================
# 2. ACTUALIZAR INDEX.HTML
# ==============================================================================
with open('index.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

# Actualizar el bloque superior y vista-menu
# Desde <!-- CABECERA SUPERIOR MODERNA --> hasta <!-- VISTA PRINCIPAL: ACCIONES Y DESARROLLO
old_menu_regex = re.compile(
    r'<!-- CABECERA SUPERIOR MODERNA -->.*?<!-- VISTA PRINCIPAL: ACCIONES Y DESARROLLO',
    re.DOTALL
)

new_menu_html = """<!-- CABECERA SUPERIOR MODERNA / CYBERNETIC OS HEADER -->
    <header class="monarca-top-nav">
        <div class="monarca-brand-container">
            <div class="monarca-brand-mark">✦</div>
            <div>
                <h1 class="monarca-brand-title">Sistema Monarca</h1>
                <p class="monarca-brand-subtitle">Executive Telemetry OS</p>
            </div>
        </div>
        <div class="monarca-top-meta">
            <div id="cloud-sync-badge" class="cloud-sync-badge status-syncing" onclick="window.MonarcaCloud && window.MonarcaCloud.forzarSincronizacion()" title="Sincronización con Firebase Firestore. Clic para forzar sincronización.">
                <span class="cloud-sync-dot"></span>
                <span class="cloud-sync-text">Conectando nube...</span>
            </div>
            <div class="user-pill-badge">
                <span class="user-pill-dot"></span>
                Gabriel Arias
            </div>
        </div>
    </header>

    <!-- VISTA 1: MENÚ PRINCIPAL -->
    <div id="vista-menu" class="tab-content active">
        <div class="user-header-card">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px;">
                <div style="display: flex; align-items: center; gap: 14px;">
                    <div style="width: 48px; height: 48px; border-radius: 14px; background: linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(56, 189, 248, 0.15)); border: 1px solid rgba(99, 102, 241, 0.4); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px; color: #818cf8; box-shadow: 0 0 20px rgba(99, 102, 241, 0.2);">
                        GA
                    </div>
                    <div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <h2 id="player-title" style="margin: 0; font-weight: 800; letter-spacing: -0.3px; font-size: 20px;">Gabriel Arias</h2>
                            <span style="font-size: 10px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; padding: 2px 8px; border-radius: 6px; background: rgba(99, 102, 241, 0.2); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.35);">EJECUTIVO</span>
                        </div>
                        <p id="player-level" style="margin: 4px 0 0 0; color: #94a3b8; font-size: 13px; font-weight: 500;">Nivel: -- | EXP: -- / --</p>
                    </div>
                </div>
                <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                    <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 6px 14px; text-align: center;">
                        <div style="font-size: 9.5px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.06em;">TELEMETRÍA</div>
                        <div style="font-size: 12.5px; color: #34d399; font-weight: 700; display: flex; align-items: center; gap: 5px;">
                            <span style="width: 6px; height: 6px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981;"></span>
                            ACTIVA
                        </div>
                    </div>
                    <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 6px 14px; text-align: center;">
                        <div style="font-size: 9.5px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.06em;">SISTEMA</div>
                        <div style="font-size: 12.5px; color: #f8fafc; font-weight: 700;">v7.6</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="grid-menu">
            <!-- 1. PERFIL -->
            <div class="menu-card" onclick="cambiarVista('vista-perfil')">
                <div class="menu-card-top">
                    <div class="menu-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    </div>
                    <span class="menu-badge">RANGO & BIO</span>
                </div>
                <div>
                    <h3>Perfil</h3>
                    <p>Rango, EXP y Atributos Personales</p>
                </div>
                <div class="menu-card-footer">
                    <span class="menu-card-arrow">Acceder →</span>
                </div>
            </div>

            <!-- 2. ACCIONES Y DESARROLLO -->
            <div class="menu-card" onclick="cambiarVista('vista-acciones-progresion')">
                <div class="menu-card-top">
                    <div class="menu-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                    </div>
                    <span class="menu-badge">OPERATIVO</span>
                </div>
                <div>
                    <h3>Acciones y Desarrollo</h3>
                    <p>Quests Diarias, Hábitos & Skills</p>
                </div>
                <div class="menu-card-footer">
                    <span class="menu-card-arrow">Acceder →</span>
                </div>
            </div>

            <!-- 3. ENTRENAMIENTO -->
            <div class="menu-card" onclick="cambiarVista('vista-ejercicios')">
                <div class="menu-card-top">
                    <div class="menu-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                    </div>
                    <span class="menu-badge">BIO-HUD</span>
                </div>
                <div>
                    <h3>Entrenamiento</h3>
                    <p>Cuerpo (Anatomía) & Cognición</p>
                </div>
                <div class="menu-card-footer">
                    <span class="menu-card-arrow">Acceder →</span>
                </div>
            </div>

            <!-- 4. ESTADO PERSONAL -->
            <div class="menu-card" onclick="cambiarVista('vista-estado-personal')">
                <div class="menu-card-top">
                    <div class="menu-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    </div>
                    <span class="menu-badge">TELEMETRÍA</span>
                </div>
                <div>
                    <h3>Estado Personal</h3>
                    <p>Métricas, Vitalidad & Recuperación</p>
                </div>
                <div class="menu-card-footer">
                    <span class="menu-card-arrow">Acceder →</span>
                </div>
            </div>

            <!-- 5. FINANZAS -->
            <div class="menu-card" onclick="cambiarVista('vista-finanzas')">
                <div class="menu-card-top">
                    <div class="menu-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
                    </div>
                    <span class="menu-badge">CAPITAL</span>
                </div>
                <div>
                    <h3>Finanzas</h3>
                    <p>Balance, Activos y Flujo de Caja</p>
                </div>
                <div class="menu-card-footer">
                    <span class="menu-card-arrow">Acceder →</span>
                </div>
            </div>

            <!-- 6. IDEAS -->
            <div class="menu-card" onclick="cambiarVista('vista-ideas')">
                <div class="menu-card-top">
                    <div class="menu-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="9" y1="18" x2="15" y2="18"></line><line x1="10" y1="22" x2="14" y2="22"></line><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"></path></svg>
                    </div>
                    <span class="menu-badge">NEURAL</span>
                </div>
                <div>
                    <h3>Ideas</h3>
                    <p>Incubadora de Proyectos & Notas</p>
                </div>
                <div class="menu-card-footer">
                    <span class="menu-card-arrow">Acceder →</span>
                </div>
            </div>

            <!-- 7. CONOCIMIENTO -->
            <div class="menu-card" onclick="cambiarVista('vista-conocimiento')">
                <div class="menu-card-top">
                    <div class="menu-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    </div>
                    <span class="menu-badge">ARCHIVO</span>
                </div>
                <div>
                    <h3>Conocimiento</h3>
                    <p>Biblioteca & Bóveda de Estudio</p>
                </div>
                <div class="menu-card-footer">
                    <span class="menu-card-arrow">Acceder →</span>
                </div>
            </div>

            <!-- 8. LABORES -->
            <div class="menu-card" onclick="cambiarVista('vista-labores')">
                <div class="menu-card-top">
                    <div class="menu-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                    </div>
                    <span class="menu-badge">LABORES</span>
                </div>
                <div>
                    <h3>Labores</h3>
                    <p>Gestión Laboral, Metas & Entregas</p>
                </div>
                <div class="menu-card-footer">
                    <span class="menu-card-arrow">Acceder →</span>
                </div>
            </div>

            <!-- 9. PERSONAS -->
            <div class="menu-card" onclick="cambiarVista('vista-personas')">
                <div class="menu-card-top">
                    <div class="menu-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    </div>
                    <span class="menu-badge">NETWORK</span>
                </div>
                <div>
                    <h3>Personas</h3>
                    <p>Red de Contactos y Vínculos</p>
                </div>
                <div class="menu-card-footer">
                    <span class="menu-card-arrow">Acceder →</span>
                </div>
            </div>

            <!-- 10. RULETA -->
            <div class="menu-card" onclick="cambiarVista('vista-ruleta')">
                <div class="menu-card-top">
                    <div class="menu-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
                    </div>
                    <span class="menu-badge">ALEATORIO</span>
                </div>
                <div>
                    <h3>Ruleta</h3>
                    <p>Toma de Decisiones y Azar Guiado</p>
                </div>
                <div class="menu-card-footer">
                    <span class="menu-card-arrow">Acceder →</span>
                </div>
            </div>

            <!-- 11. CALENDARIO -->
            <div class="menu-card" onclick="cambiarVista('vista-calendario')">
                <div class="menu-card-top">
                    <div class="menu-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    </div>
                    <span class="menu-badge">CRONOS</span>
                </div>
                <div>
                    <h3>Calendario</h3>
                    <p>Alarmas Nativas & Cronograma</p>
                </div>
                <div class="menu-card-footer">
                    <span class="menu-card-arrow">Acceder →</span>
                </div>
            </div>

            <!-- 12. INVENTARIO -->
            <div class="menu-card" onclick="cambiarVista('vista-inventario')">
                <div class="menu-card-top">
                    <div class="menu-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                    </div>
                    <span class="menu-badge">VAULT</span>
                </div>
                <div>
                    <h3>Inventario</h3>
                    <p>Loot, Ítems & Recompensas</p>
                </div>
                <div class="menu-card-footer">
                    <span class="menu-card-arrow">Acceder →</span>
                </div>
            </div>
        </div>
    </div>

    <!-- VISTA PRINCIPAL: ACCIONES Y DESARROLLO"""

if not old_menu_regex.search(html_content):
    print("ERROR: No se encontró el bloque del menú en index.html")
    sys.exit(1)

html_content = old_menu_regex.sub(new_menu_html, html_content)

# Agregar la barra flotante monarca-bottom-hud antes del cierre de .container
bottom_hud_html = """
    <!-- BARRA HUD INFERIOR FLOTANTE (ESTILO PACEFUEL / HULY) -->
    <nav class="monarca-bottom-hud" aria-label="Navegación Rápida">
        <button class="bottom-hud-item active" onclick="cambiarVista('vista-menu')" title="Menú Principal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            <span>Menú</span>
        </button>
        <button class="bottom-hud-item" onclick="cambiarVista('vista-acciones-progresion')" title="Quests del Día">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <span>Quests</span>
        </button>
        <button class="bottom-hud-item" onclick="cambiarVista('vista-ejercicios')" title="Entrenamiento Bio-HUD">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
            <span>Bio-HUD</span>
        </button>
        <button class="bottom-hud-item" onclick="cambiarVista('vista-finanzas')" title="Finanzas">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
            <span>Capital</span>
        </button>
        <button class="bottom-hud-item" onclick="abrirModalJarvisVoz(true)" title="Jarvis Comandos de Voz">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
            <span>Jarvis</span>
        </button>
    </nav>
</div>
"""

# Reemplazar el cierre de .container
if '<button id="btn-asistente-flotante"' in html_content:
    html_content = html_content.replace(
        '    <!-- BOTÓN FLOTANTE DE ASISTENCIA RÁPIDA (ACCESO GLOBAL) -->\n    <button id="btn-asistente-flotante" onclick="abrirAsistenteRapido()" title="Asistente Monarca · Captura Rápida" aria-label="Asistente Rápido">\n        <span style="font-size: 20px;">✦</span>\n    </button>\n</div>',
        '    <!-- BOTÓN FLOTANTE DE ASISTENCIA RÁPIDA (ACCESO GLOBAL) -->\n    <button id="btn-asistente-flotante" onclick="abrirAsistenteRapido()" title="Asistente Monarca · Captura Rápida" aria-label="Asistente Rápido">\n        <span style="font-size: 20px;">✦</span>\n    </button>' + bottom_hud_html
    )

# Bump version a v7.6 en index.html
html_content = html_content.replace('v=7.5', 'v=7.6')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html_content)

print("✓ index.html actualizado con éxito.")

# ==============================================================================
# 3. ACTUALIZAR SW.JS (CACHE VERSION BUMP)
# ==============================================================================
with open('sw.js', 'r', encoding='utf-8') as f:
    sw_content = f.read()

sw_content = sw_content.replace('sistema-monarca-v7.5', 'sistema-monarca-v7.6')
sw_content = sw_content.replace('v=6.7', 'v=7.6')
sw_content = sw_content.replace('v=7.5', 'v=7.6')

with open('sw.js', 'w', encoding='utf-8') as f:
    f.write(sw_content)

print("✓ sw.js actualizado a v7.6.")

# ==============================================================================
# 4. ACTUALIZAR JS/CORE.JS (BOTTOM HUD SYNC EN CAMBIARVISTA)
# ==============================================================================
with open('js/core.js', 'r', encoding='utf-8') as f:
    core_content = f.read()

target_core = "    switch(vistaId) {"
replacement_core = """    // Sincronizar estado visual de la barra HUD inferior flotante
    try {
        var hudItems = document.querySelectorAll('.bottom-hud-item');
        hudItems.forEach(function(item) {
            var oc = item.getAttribute('onclick') || '';
            if (oc.indexOf("'" + vistaId + "'") !== -1) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    } catch(e) {}

    switch(vistaId) {"""

if target_core in core_content and "hudItems" not in core_content:
    core_content = core_content.replace(target_core, replacement_core)
    with open('js/core.js', 'w', encoding='utf-8') as f:
        f.write(core_content)
    print("✓ js/core.js actualizado con sincronización HUD.")
else:
    print("ℹ js/core.js ya contenía la sincronización o no se encontró el target.")

print("=== REDISEÑO VISUAL COMPLETADO EXITOSAMENTE ===")
