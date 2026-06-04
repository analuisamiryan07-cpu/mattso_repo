/* Carousel for home page – CAPACITACIONES DESTACADAS */
document.addEventListener("DOMContentLoaded", function () {

    var capDestacadas = [
        { titulo: "Cuidado de Personas Adultas Mayores", horas: "120 Horas", inversion: "$120.00", modalidad: "Virtual", vigencia: 2, inicia: "20 de mayo de 2026", img: "https://picsum.photos/400/250?random=10" },
        { titulo: "Entrenamiento Canino", horas: "140 Horas", inversion: "$120.00", modalidad: "Presencial", vigencia: 2, inicia: "20 de mayo de 2026", img: "https://picsum.photos/400/250?random=11" },
        { titulo: "Instalaciones Hidrosanitarias", horas: "160 Horas", inversion: "$120.00", modalidad: "Virtual", vigencia: 2, inicia: "20 de mayo de 2026", img: "https://picsum.photos/400/250?random=12" },
        { titulo: "Armado de Estructuras Met\u00e1licas", horas: "180 Horas", inversion: "$120.00", modalidad: "Presencial", vigencia: 2, inicia: "20 de mayo de 2026", img: "https://picsum.photos/400/250?random=13" },
        { titulo: "Gesti\u00f3n Administrativa del Sistema de Salud", horas: "200 Horas", inversion: "$120.00", modalidad: "Virtual", vigencia: 2, inicia: "20 de mayo de 2026", img: "https://picsum.photos/400/250?random=14" },
        { titulo: "Operaciones de L\u00edneas y Redes Energizadas", horas: "220 Horas", inversion: "$120.00", modalidad: "Presencial", vigencia: 2, inicia: "20 de mayo de 2026", img: "https://picsum.photos/400/250?random=15" },
        { titulo: "Actividades Auxiliares de Liniero", horas: "240 Horas", inversion: "$120.00", modalidad: "Virtual", vigencia: 2, inicia: "20 de mayo de 2026", img: "https://picsum.photos/400/250?random=16" }
    ];

    var track = document.getElementById("carousel-track-cap");
    if (!track) return;

    var html = "";
    capDestacadas.forEach(function (c) {
        var modalidadIcon = c.modalidad === "Presencial" ? "fas fa-users" : "fas fa-laptop";
        html += '<div class="carousel-slide">' +
            '<div class="catalog-card carousel-card-full">' +
                '<div class="card-image-wrap">' +
                    '<img src="' + c.img + '" class="card-image" alt="' + c.titulo + '" onerror="this.src=\'https://via.placeholder.com/400x250/e2e8f0/a0aec0?text=MATTSO\'">' +
                    '<div class="card-badge" style="background:#ddb21d;color:#0b3155;">CAPACITACI\u00d3N</div>' +
                '</div>' +
                '<div class="card-body-modern">' +
                    '<h3 class="card-title-modern">' + c.titulo + '</h3>' +
                    '<div class="card-top-info">' +
                        '<span class="badge-date-prefix"><i class="fas fa-calendar-alt" style="margin-right:5px;color:#FBB034;"></i>Inicia: </span>' +
                        '<span class="badge-date">' + c.inicia + '</span>' +
                    '</div>' +
                    '<div class="card-metrics-grid">' +
                        '<div class="metric">' +
                            '<i class="far fa-clock"></i>' +
                            '<div class="metric-info"><small>Duraci\u00f3n</small><span>' + c.horas + '</span></div>' +
                        '</div>' +
                        '<div class="metric">' +
                            '<i class="' + modalidadIcon + '"></i>' +
                            '<div class="metric-info"><small>Modalidad</small><span>' + c.modalidad + '</span></div>' +
                        '</div>' +
                        '<div class="metric">' +
                            '<i class="fas fa-calendar-check"></i>' +
                            '<div class="metric-info"><small>Vigencia</small><span>' + c.vigencia + ' a\u00f1os</span></div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="card-price-modern">' +
                        '<span>Inversi\u00f3n:</span>' +
                        '<strong>' + c.inversion + '</strong>' +
                    '</div>' +
                    '<div class="card-actions-modern">' +
                        '<button onclick="addToCart(\'' + c.titulo + '\', \'' + c.inversion + '\', \'' + c.img + '\', \'' + c.modalidad + '\')" class="btn-cart"><i class="fas fa-cart-plus"></i> A\u00f1adir al carrito</button>' +
                        '<a href="capacitaciones.html" class="btn-info">M\u00c1S INFORMACI\u00d3N</a>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    });

    track.innerHTML = html;

    // Carousel logic
    var slides = track.querySelectorAll(".carousel-slide");
    var totalOriginal = slides.length;

    for (var i = 0; i < totalOriginal; i++) {
        track.appendChild(slides[i].cloneNode(true));
    }

    var position = 0;
    var speed = 0.4;
    var allSlides = track.querySelectorAll(".carousel-slide");
    var slideWidth = allSlides[0].offsetWidth;
    var totalWidth = slideWidth * totalOriginal;
    var paused = false;

    track.addEventListener("mouseenter", function () { paused = true; });
    track.addEventListener("mouseleave", function () { paused = false; });

    function animateCarousel() {
        if (!paused) {
            position += speed;
            if (position >= totalWidth) {
                position = 0;
            }
            track.style.transform = "translateX(-" + position + "px)";
        }
        requestAnimationFrame(animateCarousel);
    }

    window.addEventListener("resize", function () {
        var s = track.querySelector(".carousel-slide");
        if (s) {
            slideWidth = s.offsetWidth;
            totalWidth = slideWidth * totalOriginal;
        }
    });

    requestAnimationFrame(animateCarousel);
});
