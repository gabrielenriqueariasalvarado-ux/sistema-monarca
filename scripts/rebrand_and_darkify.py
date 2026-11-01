import sys
import os
import re

sys.stdout.reconfigure(encoding='utf-8')

print("=== INICIANDO TRANSFORMACIÓN COMPLETA A 'EMILY' & DARK CYBER SUITE ===")

# ==============================================================================
# 1. MANIFEST.JSON & CAPACITOR.CONFIG.JSON
# ==============================================================================
with open('manifest.json', 'r', encoding='utf-8') as f:
    manifest = f.read()

manifest = manifest.replace('"name": "Sistema Monarca"', '"name": "Emily"')
manifest = manifest.replace('"short_name": "Monarca"', '"short_name": "Emily"')
manifest = manifest.replace('Sistema Personal Monarca', 'Emily OS - Asistente Inteligente')
manifest = manifest.replace('"background_color": "#f0f2f5"', '"background_color": "#080a0f"')
manifest = manifest.replace('"theme_color": "#111827"', '"theme_color": "#080a0f"')

with open('manifest.json', 'w', encoding='utf-8') as f:
    f.write(manifest)
print("✓ manifest.json actualizado: App nombrada 'Emily'.")

with open('capacitor.config.json', 'r', encoding='utf-8') as f:
    cap = f.read()
cap = cap.replace('"appName": "Sistema Monarca"', '"appName": "Emily"')
with open('capacitor.config.json', 'w', encoding='utf-8') as f:
    f.write(cap)
print("✓ capacitor.config.json actualizado a 'Emily'.")

# ==============================================================================
# 2. JS/PERFIL.JS (CARDS OBSIDIANA & DARK LUXURY)
# ==============================================================================
with open('js/perfil.js', 'r', encoding='utf-8') as f:
    perfil_js = f.read()

# Reemplazar cajas blancas por cajas oscuras grafito
perfil_js = perfil_js.replace('background: #ffffff; border: 1px solid #e5e7eb;', 'background: #0f131d; border: 1px solid rgba(255, 255, 255, 0.08);')
perfil_js = perfil_js.replace('background: #f9fafb; border: 1px solid #e5e7eb;', 'background: #141926; border: 1px solid rgba(255, 255, 255, 0.08);')
perfil_js = perfil_js.replace('background: #f3f4f6;', 'background: rgba(255, 255, 255, 0.04);')
perfil_js = perfil_js.replace('color: #111827;', 'color: #f8fafc;')
perfil_js = perfil_js.replace('color: #1f2937;', 'color: #f8fafc;')
perfil_js = perfil_js.replace('color: #4b5563;', 'color: #94a3b8;')
perfil_js = perfil_js.replace('color: #374151;', 'color: #cbd5e1;')
perfil_js = perfil_js.replace('border-bottom: 1px solid #f3f4f6;', 'border-bottom: 1px solid rgba(255, 255, 255, 0.08);')

with open('js/perfil.js', 'w', encoding='utf-8') as f:
    f.write(perfil_js)
print("✓ js/perfil.js transformado a dark mode.")

# ==============================================================================
# 3. JS/PROGRESION.JS (QUESTS TIEMPO BOX & CARDS OSCURAS)
# ==============================================================================
with open('js/progresion.js', 'r', encoding='utf-8') as f:
    progresion_js = f.read()

progresion_js = progresion_js.replace(
    'background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px;',
    'background: #0b0e15; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px;'
)
progresion_js = progresion_js.replace('border: 1px solid #d1d5db; background: #ffffff; color: #4b5563;', 'border: 1px solid rgba(255, 255, 255, 0.12); background: #131826; color: #cbd5e1;')
progresion_js = progresion_js.replace('background: #e5e7eb; border-radius: 9999px; height: 6px;', 'background: rgba(255, 255, 255, 0.08); border-radius: 9999px; height: 6px;')

with open('js/progresion.js', 'w', encoding='utf-8') as f:
    f.write(progresion_js)
print("✓ js/progresion.js actualizado.")

# ==============================================================================
# 4. JS/ESTADO-PERSONAL.JS (DIAGNÓSTICO AVATAR & HEATMAP PACFUEL)
# ==============================================================================
with open('js/estado-personal.js', 'r', encoding='utf-8') as f:
    estado_js = f.read()

# 4.1 Timer de Cierre de Jornada
estado_js = estado_js.replace(
    'daily-reset-timer-banner" style="margin-bottom: 16px; padding: 14px 18px; border-radius: 14px; background: #ffffff; border: 1px solid #e5e7eb;',
    'daily-reset-timer-banner" style="margin-bottom: 16px; padding: 14px 18px; border-radius: 14px; background: #121725; border: 1px solid rgba(255, 255, 255, 0.09);'
)
# 4.2 Barra de Desgaste General Diario
estado_js = estado_js.replace(
    'avatar-metrics-bar" style="margin-bottom: 18px; border-radius: 16px; background: #ffffff; border: 1px solid #e5e7eb;',
    'avatar-metrics-bar" style="margin-bottom: 18px; border-radius: 16px; background: #121725; border: 1px solid rgba(255, 255, 255, 0.09);'
)
estado_js = estado_js.replace(
    'general-wear-circle" style="border: 3px solid #111827; color: #111827; background: #ffffff;"',
    'general-wear-circle" style="border: 3px solid #6366f1; color: #f8fafc; background: #0b0e15; box-shadow: 0 0 16px rgba(99, 102, 241, 0.3);"'
)
# 4.3 Carga Promedio y Último Cierre
estado_js = estado_js.replace('background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 7px 14px;', 'background: #0b0e15; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 7px 14px;')

# 4.4 Colores de textos en HUD Avatar
estado_js = estado_js.replace('color: #111827;', 'color: #f8fafc;')
estado_js = estado_js.replace('color: #1f2937;', 'color: #f8fafc;')
estado_js = estado_js.replace('color: #374151;', 'color: #cbd5e1;')
estado_js = estado_js.replace('color: #4b5563;', 'color: #94a3b8;')

# 4.5 Legend Box del Mapa de Calor
estado_js = estado_js.replace(
    'background: #ffffff; border: 1.5px solid #d1d5db;"',
    'background: #111827; border: 1.5px solid rgba(255, 255, 255, 0.2);"'
)

# 4.6 obtenerEstiloFatigaGris
estado_js = estado_js.replace("fill: '#ffffff'", "fill: '#151b2a'")
estado_js = estado_js.replace("cardBg: '#ffffff'", "cardBg: '#0f131d'")
estado_js = estado_js.replace("cardBorder: '#e5e7eb'", "cardBorder: 'rgba(255, 255, 255, 0.08)'")
estado_js = estado_js.replace("cardText: '#111827'", "cardText: '#f8fafc'")
estado_js = estado_js.replace("bg: '#ffffff'", "bg: '#0f131d'")

with open('js/estado-personal.js', 'w', encoding='utf-8') as f:
    f.write(estado_js)
print("✓ js/estado-personal.js actualizado a dark mode.")

# ==============================================================================
# 5. JS/JARVIS-VOZ.JS -> REBRANDING A EMILY (ASISTENTE INTELIGENTE)
# ==============================================================================
with open('js/jarvis-voz.js', 'r', encoding='utf-8') as f:
    voz_js = f.read()

# Respuestas y diálogos hablados
voz_js = voz_js.replace("Soy Jarvis,", "Soy Emily,")
voz_js = voz_js.replace("soy Jarvis,", "soy Emily,")
voz_js = voz_js.replace("Jarvis a la escucha", "Emily a la escucha")
voz_js = voz_js.replace("Jarvis iniciado", "Emily iniciada")
voz_js = voz_js.replace("¡Hola! Soy Jarvis", "¡Hola Gabriel! Soy Emily")
voz_js = voz_js.replace("Hola Gabriel, soy Jarvis", "Hola Gabriel, soy Emily")
voz_js = voz_js.replace("Hola, soy Jarvis", "Hola Gabriel, soy Emily")
voz_js = voz_js.replace("'jarvis'", "'emily'")
voz_js = voz_js.replace('"jarvis"', '"emily"')
voz_js = voz_js.replace("Jarvis:", "Emily:")

# Soporte de wake word doble (responde tanto a "emily" como a "jarvis")
voz_js = voz_js.replace(
    "transcript.includes('emily')",
    "(transcript.includes('emily') || transcript.includes('jarvis'))"
)

# Aliases de funciones globales
voz_js += """

// ALIAS GLOBALES DE REBRANDING: EMILY AI
window.abrirModalEmilyVoz = window.abrirModalJarvisVoz;
window.iniciarReconocimientoEmily = window.iniciarReconocimientoJarvis;
window.detenerReconocimientoEmily = window.detenerReconocimientoJarvis;
"""

with open('js/jarvis-voz.js', 'w', encoding='utf-8') as f:
    f.write(voz_js)
print("✓ js/jarvis-voz.js rebrandeado a Emily.")

# ==============================================================================
# 6. STYLE.CSS (UNIVERSAL DARK THEME & ELIMINACIÓN DE CAJAS BLANCAS)
# ==============================================================================
with open('style.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Adición de reglas universales para sub-vistas
subviews_dark_css = """

/* ==========================================================================
   EMILY OS · SUITE OSCURA TOTAL (TODAS LAS SUB-VISTAS & CONTENEDORES)
   ========================================================================== */

/* 1. TARJETAS DE RUTINAS Y ENTRENAMIENTO (.quest-card) */
.quest-card {
    background: #121725 !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    color: #f8fafc !important;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 4px 16px rgba(0, 0, 0, 0.5) !important;
}

.quest-card:hover {
    border-color: rgba(99, 102, 241, 0.4) !important;
    background: #161c2d !important;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 8px 24px rgba(0, 0, 0, 0.7) !important;
    transform: translateY(-2px);
}

.quest-card-name {
    color: #f8fafc !important;
}

.quest-icon-box {
    background: rgba(255, 255, 255, 0.04) !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    color: #818cf8 !important;
}

.quest-badge-rank {
    background: rgba(255, 255, 255, 0.04) !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    color: #94a3b8 !important;
}

.muscle-tag {
    background: rgba(255, 255, 255, 0.05) !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    color: #cbd5e1 !important;
}

.muscle-tags-row span {
    border-color: rgba(255, 255, 255, 0.08) !important;
}

/* 2. REGLAS, METAS & FINANZAS */
.regla-card, .meta-card, .total-box-finanzas, .category-card, .subcategory-section {
    background: #121725 !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    color: #f8fafc !important;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 4px 16px rgba(0, 0, 0, 0.5) !important;
}

.regla-card:hover, .meta-card:hover, .category-card:hover {
    border-color: rgba(99, 102, 241, 0.4) !important;
    background: #161c2d !important;
}

.meta-progress-track {
    background: rgba(255, 255, 255, 0.08) !important;
}

.meta-cuotas-info {
    background: #0b0e15 !important;
    border: 1px solid rgba(255, 255, 255, 0.06) !important;
    color: #94a3b8 !important;
}

/* 3. IDEAS & PROYECTOS */
.ideas-panel-box, .metric-card-ideas, .chart-container-ideas, .sheet-sync-box {
    background: #121725 !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    color: #f8fafc !important;
}

.idea-clean-item {
    background: #0f131d !important;
    border: 1px solid rgba(255, 255, 255, 0.06) !important;
    color: #f8fafc !important;
}

.idea-clean-item:hover {
    background: #141926 !important;
    border-color: rgba(99, 102, 241, 0.35) !important;
}

.btn-ideas-tab {
    background: #0f131d !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    color: #94a3b8 !important;
}

.btn-ideas-tab:hover {
    background: #161c2d !important;
    color: #ffffff !important;
}

.btn-ideas-tab.active {
    background: #6366f1 !important;
    border-color: #6366f1 !important;
    color: #ffffff !important;
}

/* 4. INVENTARIO & ÍTEMS */
.item-card, .inventario-card, .loot-card {
    background: #121725 !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    color: #f8fafc !important;
}

.item-card:hover, .loot-card:hover {
    border-color: rgba(99, 102, 241, 0.4) !important;
    background: #161c2d !important;
}

/* 5. CALENDARIO */
.calendar-day {
    background: #0f131d !important;
    border: 1px solid rgba(255, 255, 255, 0.06) !important;
    color: #f8fafc !important;
}

.calendar-day:hover {
    background: #141926 !important;
    border-color: rgba(99, 102, 241, 0.35) !important;
}

.calendar-day.active-day, .calendar-day.today {
    border-color: #6366f1 !important;
    box-shadow: 0 0 10px rgba(99, 102, 241, 0.4) !important;
}

/* 6. LABORES & PERSONAS */
.labor-card, .persona-card, .contacto-card {
    background: #121725 !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    color: #f8fafc !important;
}

.labor-card:hover, .persona-card:hover {
    border-color: rgba(99, 102, 241, 0.4) !important;
    background: #161c2d !important;
}

/* 7. SKILLS */
.skill-card {
    background: #121725 !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    color: #f8fafc !important;
}

.skill-card:hover {
    border-color: rgba(99, 102, 241, 0.4) !important;
    background: #161c2d !important;
}

.skill-rank-badge {
    background: rgba(255, 255, 255, 0.05) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    color: #cbd5e1 !important;
}

.skill-progress-track {
    background: rgba(255, 255, 255, 0.08) !important;
}

.skill-benefit-row {
    background: #0b0e15 !important;
    border: 1px solid rgba(255, 255, 255, 0.06) !important;
    color: #94a3b8 !important;
}

/* 8. OVERRIDES GENERALES PARA ELEMENTOS INTERNOS DE TODAS LAS VISTAS */
.tab-content h2, .tab-content h3, .tab-content h4 {
    color: #f8fafc !important;
}

.tab-content p {
    color: #94a3b8 !important;
}

.tab-content strong {
    color: #f8fafc !important;
}

.heatmap-legend-box {
    background: #07090e !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
}

.legend-item {
    color: #94a3b8 !important;
}

/* MODALES Y SELECTORES */
.modal-system-window {
    background: #0f131d !important;
    border: 1px solid rgba(255, 255, 255, 0.12) !important;
    color: #f8fafc !important;
}

.modal-system-header {
    background: #131826 !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
}

.modal-input, .ideas-select {
    background-color: #0b0e15 !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    color: #f8fafc !important;
}

.modal-input:focus, .ideas-select:focus {
    border-color: #6366f1 !important;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2) !important;
}
"""

with open('style.css', 'w', encoding='utf-8') as f:
    f.write(css + subviews_dark_css)
print("✓ style.css actualizado con estilos oscuros para todos los apartados.")

# ==============================================================================
# 7. INDEX.HTML -> REBRANDING A EMILY & PURGA DE INLINE WHITE
# ==============================================================================
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Rebranding en title y headers
html = html.replace('<title>Sistema Monarca</title>', '<title>Emily · Executive OS</title>')
html = html.replace('<meta name="apple-mobile-web-app-title" content="Sistema Monarca">', '<meta name="apple-mobile-web-app-title" content="Emily">')
html = html.replace('<h1 class="monarca-brand-title">Sistema Monarca</h1>', '<h1 class="monarca-brand-title">Emily</h1>')
html = html.replace('<p class="monarca-brand-subtitle">Executive Telemetry OS</p>', '<p class="monarca-brand-subtitle">AI & Executive Telemetry OS</p>')

# Bottom HUD label Jarvis -> Emily
html = html.replace('<span>Jarvis</span>', '<span>Emily</span>')
html = html.replace('title="Jarvis Comandos de Voz"', 'title="Emily (Comandos de Voz)"')
html = html.replace('title="Jarvis Voz"', 'title="Emily"')

# Floating buttons
html = html.replace('title="Monarca Voz · Jarvis (Comandos de voz)"', 'title="Emily · Asistente de Voz"')
html = html.replace('title="Asistente Monarca · Captura Rápida"', 'title="Emily · Captura Rápida"')

# Modal Jarvis -> Modal Emily
html = html.replace('<span>🎙️ Monarca Voz · Jarvis</span>', '<span>🎙️ Emily · Asistente de Voz Inteligente</span>')
html = html.replace('Jarvis · Asistente por Comandos de Voz', 'Emily · Asistente de Voz Inteligente')
html = html.replace('Monarca Voz', 'Emily AI')
html = html.replace('Asistente Monarca', 'Asistente Emily')
html = html.replace('Di "Jarvis"', 'Di "Emily"')
html = html.replace('Di \\"Jarvis\\"', 'Di \\"Emily\\"')
html = html.replace('Jarvis está escuchando...', 'Emily está escuchando...')

# Bump version a v7.7
html = html.replace('v=7.6', 'v=7.7')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("✓ index.html rebrandeado a Emily y versionado a v7.7.")

# ==============================================================================
# 8. SW.JS (BUMP A V7.7)
# ==============================================================================
with open('sw.js', 'r', encoding='utf-8') as f:
    sw = f.read()

sw = sw.replace('sistema-monarca-v7.6', 'emily-os-v7.7')
sw = sw.replace('v=7.6', 'v=7.7')

with open('sw.js', 'w', encoding='utf-8') as f:
    f.write(sw)
print("✓ sw.js actualizado a emily-os-v7.7.")

print("=== TRANSFORMACIÓN FINALIZADA CON ÉXITO ===")
