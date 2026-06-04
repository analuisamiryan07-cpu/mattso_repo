document.addEventListener("DOMContentLoaded", function() {
    const rawList = [
        "Actividades Auxiliares de Liniero",
        "Administración de Empresas",
        "Armado de Estructuras Metálicas",
        "Asesoría de Imagen",
        "Asistencia a la Supervisión de Actividades de Construcción - Estructura e Infraestructura",
        "Asistencia de Actividades de Articulación Local para la Prevención y Reducción de la Desnutrición Crónica Infantil",
        "Asistencia de Contabilidad",
        "Asistencia en Gestión Documental y Archivo",
        "Asistencia en Seguridad Industrial",
        "Atención Integral en Centro de Desarrollo Infantil",
        "Conductor Profesional de Bus - NTE INEN 2 463: 2008",
        "Coordinación de Centro de Desarrollo Infantil",
        "Coordinación Territorial para la Prevención y Reducción de la Desnutrición Crónica Infantil",
        "Cuidado de Personas Adultas Mayores",
        "Entrenamiento Canino: Defensa y Protección",
        "Entrenamiento Canino: Detección de Sustancias y Localización de Personas",
        "Entrenamiento Canino: Intervención Asistida con Canes",
        "Evaluación de la Calidad y Excelencia en la Gestión Pública",
        "Facilitación en Actividades de Capacitación",
        "Facilitación en Actividades de Capacitación - Formación Dual",
        "Gestión Administrativa",
        "Gestión Administrativa del Sistema de Salud Desconcentrado",
        "Gestión Ambiental",
        "Gestión de Soldadura",
        "Gestión en Promoción de Marcas, Productos y Servicios",
        "Gestión Integral de Riesgos Financieros",
        "Instalaciones Eléctricas",
        "Instalaciones Hidrosanitarias",
        "Neurodesarrollo y Necesidades Educativas Especiales en el Periodo Infantojuvenil",
        "Operaciones Archivísticas / Administración de Archivos",
        "Operaciones de Líneas y Redes Energizadas",
        "Prevención de Riesgos Laborales - Construcción"
    ];

    // Convert string array to detailed objects with mock data to fit the layout
    const certificacionesList = rawList.map((item, index) => {
        return {
            titulo: item,
            horas: (120 + ((index % 5) * 40)) + " Horas",
            inversion: "$150.00",
            modalidad: index % 3 === 0 ? "Virtual" : "Presencial",
            vigencia: 3,
            inicia: "20 de mayo de 2026",
            destacado: index < 5,
            desc: "Certifica tus competencias en " + item.toLowerCase() + " para respaldar tu experiencia laboral.",
            badge: "CERTIFICACIÓN",
            img: `https://picsum.photos/400/250?random=${index + 50}`
        };
    });

    const container = document.getElementById("app-catalogo");
    if (!container) return;

    const itemsHtml = certificacionesList.map(item => {
        const modalidadIcon = item.modalidad === "Presencial" ? "fas fa-users" : "fas fa-laptop";
        return `
        <div class="catalog-card">
           <div class="card-image-wrap">
               <img src="${item.img}" class="card-image" alt="Certificacion Image" onerror="this.src='https://via.placeholder.com/400x250/e2e8f0/a0aec0?text=MATTSO+IMAGEN'"/>
               <div class="card-badge">${item.badge}</div>
           </div>
           <div class="card-body-modern">
              <h3 class="card-title-modern">${item.titulo}</h3>

              <div class="card-top-info">
                 <span class="badge-date-prefix">Inicia: </span>
                 <span class="badge-date">${item.inicia}</span>
              </div>
              
              <div class="card-metrics-grid">
                 <div class="metric">
                    <i class="far fa-clock"></i>
                    <div class="metric-info">
                       <small>Duración</small>
                       <span>${item.horas}</span>
                    </div>
                 </div>
                 <div class="metric">
                    <i class="${modalidadIcon}"></i>
                    <div class="metric-info">
                       <small>Modalidad</small>
                       <span>${item.modalidad}</span>
                    </div>
                 </div>
                 <div class="metric">
                    <i class="fas fa-calendar-check"></i>
                    <div class="metric-info">
                       <small>Vigencia</small>
                       <span>${item.vigencia} año${item.vigencia !== 1 ? 's' : ''}</span>
                    </div>
                 </div>
              </div>

              <div class="card-price-modern">
                 <span>Inversión:</span>
                 <strong>${item.inversion}</strong>
              </div>

              <div class="card-actions-modern">
                 <button onclick="addToCart('${item.titulo}', '${item.inversion}', '${item.img}', '${item.modalidad}')" class="btn-cart"><i class="fas fa-cart-plus"></i> Añadir al carrito</button>
                 <a href="#" class="btn-info">MÁS INFORMACIÓN</a>
              </div>
           </div>
        </div>
    `;
    }).join('');

    container.innerHTML = `
    <div class="catalog-app-wrapper">
      
      <div class="hero-banner">
         <h1>CERTIFICACIONES</h1>
         <p>Expande tus horizontes profesionales con nuestras certificaciones reconocidas</p>
      </div>

      <div class="catalog-container">
        
        <a href="index2.html.html" class="btn-volver"><i class="fas fa-arrow-left"></i> Volver a la página principal</a>

        <div class="catalog-breadcrumb">
            <a href="index2.html.html">Inicio</a> <span>&rsaquo;</span> Certificaciones
        </div>

        <div class="catalog-layout">
            <aside class="catalog-sidebar">

               <div class="sidebar-box">
                  <h4 class="sidebar-box-title">CATEGORÍA</h4>
                  <ul class="sidebar-list">
                     <li><label><input type="checkbox" checked> Certificación</label> <span class="sidebar-count">25</span></li>
                     <li><label><input type="checkbox" checked> Curso</label> <span class="sidebar-count">5</span></li>
                     <li><label><input type="checkbox" checked> Diplomado</label> <span class="sidebar-count">2</span></li>
                  </ul>
               </div>

               <div class="sidebar-box">
                  <h4 class="sidebar-box-title">MODALIDAD</h4>
                  <ul class="sidebar-list">
                     <li><label><input type="checkbox" checked> Presencial</label></li>
                     <li><label><input type="checkbox" checked> Virtual</label></li>
                     <li><label><input type="checkbox" checked> Online</label></li>
                  </ul>
               </div>

               <div class="sidebar-box">
                  <h4 class="sidebar-box-title">ÁREA</h4>
                  <ul class="sidebar-list">
                     <li><label><input type="checkbox" checked> Construcción</label></li>
                     <li><label><input type="checkbox" checked> Energía</label></li>
                     <li><label><input type="checkbox" checked> Administración</label></li>
                     <li><label><input type="checkbox" checked> Seguridad Industrial</label></li>
                     <li><label><input type="checkbox" checked> Educación</label></li>
                     <li><label><input type="checkbox" checked> Otros</label></li>
                  </ul>
               </div>

            </aside>
            
            <main class="catalog-main">
                <div class="catalog-toolbar">
                    <div>Mostrando <b>${certificacionesList.length}</b> resultados</div>
                    <div>
                       <select>
                          <option>Nombre A-Z</option>
                          <option>Nombre Z-A</option>
                       </select>
                    </div>
                </div>
                <div class="catalog-grid">
                   ${itemsHtml}
                </div>
            </main>
        </div>
      </div>
    </div>`;
});
