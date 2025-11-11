// =========================================
// CONFIGURACIÓN GENERAL
// =========================================
const examSelector = document.getElementById('examSelector');
const contenidoExamen = document.getElementById('contenidoExamen');
const modoBtn = document.getElementById('modoBtn');
const temasCheckboxes = document.querySelectorAll('#temas input[type="checkbox"]');
const nombresTemas = {
    "1.1": "Constitución Española",
    "1.2": "Cortes Generales y Poder Judicial",
    "1.3": "El gobierno y la Administración Pública",
    "1.4": "Organización Territorial y Unión Europea",
    "1.5": "Datos electrónicos y Protección de Datos",
    "1.6": "Igualdad de género, no discriminación y discapacidad",
    "1.7": "Empleados Públicos",
    "2.1": "Fuentes del Derecho Administrativo",
    "2.2": "Actos Administrativos",
    "2.3": "Procedimiento Administrativo",
    "2.4": "Fases del Procedimiento Administrativo",
    "2.5": "Recursos Administrativos",
    "3.1": "Sistema Fiscal",
    "3.2": "Agencia Estatal de Administración Tributaria",
    "3.3": "Derecho Tributario",
    "3.4": "Obligados Tributarios",
    "3.5": "Obligaciones de los Contribuyentes",
    "3.6": "Consulta Tributaria",
    "3.7": "Declaración Tributaria",
    "3.8": "Procedimientos de gestión Tributaria",
    "3.9": "Procedimiento de Inspección",
    "3.10": "Extinción de la deuda Tributaria 1",
    "3.11": "Extinción de la deuda Tributaria 2",
    "3.12": "Procedimiento de Recaudación",
    "3.13": "Embargo",
    "3.14": "Sanciones tributarias",
    "3.15": "Revisión por Vía Administrativa",
    "3.16": "IRPF 1",
    "3.17": "IRPF 2",
    "3.18": "Renta no residentes",
    "3.19": "Impuesto de Sociedades",
    "3.20": "IVA 1",
    "3.21": "IVA 2",
    "3.22": "Aduanas"
};

// Añadir tooltips a cada checkbox
document.querySelectorAll('#temas input[type=checkbox]').forEach(cb => {
    const tema = cb.value;
    if (nombresTemas[tema]) cb.parentElement.setAttribute('title', nombresTemas[tema]);
});

let grafico = null;

// =========================================
// CARGA DE EXÁMENES
// =========================================
async function cargarExamen(nombreExamen) {
    const archivo = `assets/preguntas_${nombreExamen}.html`;

    try {
        const respuesta = await fetch(archivo);
        if (!respuesta.ok) throw new Error('No se pudo cargar el examen.');
        const html = await respuesta.text();
        contenidoExamen.innerHTML = html;
        document.querySelector('.header h1').textContent = `Examen ${nombreExamen}`;
        inicializarEventosPreguntas();
    } catch (error) {
        contenidoExamen.innerHTML = `<p style="color:red">Error al cargar el examen ${nombreExamen}</p>`;
        console.error(error);
    }
}

examSelector.addEventListener('change', (e) => {
    const nuevo = e.target.value;
    cargarExamen(nuevo);
});

// =========================================
// CORREGIR PREGUNTAS INDIVIDUALMENTE
// =========================================
function inicializarEventosPreguntas() {
    document.querySelectorAll('.corregir').forEach(btn => {
        btn.addEventListener('click', () => {
            const slide = btn.closest('.slide');
            corregirSlide(slide);
        });
    });
}

function corregirSlide(slide) {
    const correct = slide.querySelector('.respuesta').textContent.trim();
    const sel = slide.querySelector('input[type=radio]:checked');
    const fb = slide.querySelector('.feedback');
    slide.classList.remove('correct', 'incorrect');

    if (!sel) {
        fb.textContent = 'Selecciona una opción.';
        fb.className = 'feedback incorrect';
        return;
    }

    if (sel.value === correct) {
        slide.classList.add('correct');
        fb.textContent = '✅ Correcto';
        fb.className = 'feedback correct';
    } else {
        slide.classList.add('incorrect');
        fb.textContent = `❌ Incorrecto. Correcta: ${correct}`;
        fb.className = 'feedback incorrect';
    }
}

// =========================================
// FILTROS DE TEMAS
// =========================================
function filtrar() {
    const seleccionados = Array.from(temasCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);

    document.querySelectorAll('.slide').forEach(sl => {
        const tema = sl.dataset.tema;
        sl.style.display = seleccionados.length === 0 || seleccionados.includes(tema)
            ? 'block'
            : 'none';
    });

    const firstVisible = Array.from(document.querySelectorAll('.slide'))
        .find(s => s.style.display !== 'none');
    if (firstVisible) firstVisible.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function mostrarTodo() {
    document.querySelectorAll('.slide').forEach(s => s.style.display = 'block');
    temasCheckboxes.forEach(c => c.checked = false);
    document.querySelectorAll('.slide')[0]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// =========================================
// CORREGIR TODO + GRÁFICO
// =========================================
document.getElementById('btnCorregirTodo').addEventListener('click', function () {
    let correctas = 0, incorrectas = 0, total = 0;
    document.querySelectorAll('.slide').forEach(slide => {
        const correct = slide.querySelector('.respuesta').textContent.trim();
        const sel = slide.querySelector('input[type=radio]:checked');
        const fb = slide.querySelector('.feedback');
        slide.classList.remove('correct', 'incorrect');
        if (!sel) {
            fb.textContent = 'No respondida';
            return;
        }
        total++;
        if (sel.value === correct) {
            slide.classList.add('correct');
            fb.textContent = '✅ Correcto';
            correctas++;
        } else {
            slide.classList.add('incorrect');
            fb.textContent = `❌ Incorrecto. Correcta: ${correct}`;
            incorrectas++;
        }
    });
    setTimeout(() => mostrarGrafico(correctas, incorrectas, total), 150);
});

document.getElementById('btnReiniciar').addEventListener('click', () => {
    document.querySelectorAll('.slide').forEach(slide => {
        slide.classList.remove('correct', 'incorrect');
        slide.querySelectorAll('input[type=radio]').forEach(r => r.checked = false);
        const fb = slide.querySelector('.feedback');
        if (fb) fb.textContent = '';
    });
    const cont = document.getElementById('resultadoGrafico');
    cont.style.display = 'none';
    if (grafico) {
        grafico.destroy();
        grafico = null;
    }
});

function mostrarGrafico(correctas, incorrectas, total) {
    const visibles = Array.from(document.querySelectorAll('.slide')).filter(sl => sl.style.display !== 'none');
    const sinResponder = visibles.length - (correctas + incorrectas);

    const ctx = document.getElementById('graficoResultados').getContext('2d');
    const cont = document.getElementById('resultadoGrafico');
    const resumen = document.getElementById('resumenResultados');
    cont.style.display = 'block';

    if (grafico) grafico.destroy();

    grafico = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Correctas', 'Incorrectas', 'Sin responder'],
            datasets: [{
                data: [correctas, incorrectas, sinResponder],
                backgroundColor: ['#28a745', '#dc3545', '#ccc'],
                borderWidth: 1
            }]
        },
        options: {
            plugins: {
                legend: { position: 'bottom' },
                title: { display: true, text: 'Resultados del test (preguntas filtradas)' }
            }
        }
    });

    resumen.innerHTML = `
    <span style="color:#28a745;">✔ Correctas: ${correctas}</span> |
    <span style="color:#dc3545;">✖ Incorrectas: ${incorrectas}</span> |
    <span style="color:#666;">• Sin responder: ${sinResponder}</span>
  `;
}

// =========================================
// MODO OSCURO / CLARO
// =========================================
if (localStorage.getItem('modo') === 'oscuro') {
    document.body.classList.add('dark-mode');
    modoBtn.textContent = '☀️';
}

modoBtn.addEventListener('click', () => {
    const oscuro = document.body.classList.toggle('dark-mode');
    modoBtn.textContent = oscuro ? '☀️' : '🌙';
    localStorage.setItem('modo', oscuro ? 'oscuro' : 'claro');
});

// =========================================
// INICIO AUTOMÁTICO
// =========================================
window.addEventListener('DOMContentLoaded', () => {
    cargarExamen('2024A');
});
