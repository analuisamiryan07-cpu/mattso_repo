// Selector de idioma ES/EN, solo para el "chrome" de Moodle (header, barra
// de pestañas, títulos de sección, etiquetas de las 4 tarjetas, botones) —
// NO traduce contenido que viene de la base de datos (títulos de curso,
// texto de módulos, etc.), eso necesitaría un servicio de traducción real.

import { createContext, useContext, useState } from 'react';

const DICCIONARIO = {
  es: {
    areaPersonal: 'Área personal',
    misCursos: 'Mis cursos',
    cursosInscritos: 'Cursos inscritos',
    cursosCompletados: 'Cursos completados',
    actividadesPendientes: 'Actividades pendientes',
    actividadesCompletadas: 'Actividades completadas',
    lineaDeTiempo: 'Línea de tiempo',
    calendario: 'Calendario',
    descargar: 'Descargar',
    buscarCursos: 'Buscar en mis cursos…',
    anadirMasCursos: 'Añadir más cursos',
    notificaciones: 'Notificaciones',
    mensajes: 'Mensajes',
    verPerfil: 'Ver perfil',
    cerrarSesion: 'Cerrar sesión',
    volver: '← Volver al panel general',
    atrasados: 'Atrasados',
    proximos: 'Próximos',
    ordenarPorFecha: 'Ordenar por fecha',
    buscarActividad: 'Buscar por nombre de actividad',
    sinActividades: 'No tienes actividades con fecha límite todavía.',
    nuevoMensaje: 'Mensaje nuevo',
    escribeUnMensaje: 'Escribe tu mensaje…',
    enviar: 'Enviar',
    elegirProfesor: 'Elige a quién escribirle',
    sinNotificaciones: 'No tienes notificaciones.',
    sinMensajes: 'Todavía no hay mensajes en esta conversación.',
    buscador: 'Buscar',
  },
  en: {
    areaPersonal: 'Personal area',
    misCursos: 'My courses',
    cursosInscritos: 'Enrolled courses',
    cursosCompletados: 'Completed courses',
    actividadesPendientes: 'Pending activities',
    actividadesCompletadas: 'Completed activities',
    lineaDeTiempo: 'Timeline',
    calendario: 'Calendar',
    descargar: 'Download',
    buscarCursos: 'Search my courses…',
    anadirMasCursos: 'Add more courses',
    notificaciones: 'Notifications',
    mensajes: 'Messages',
    verPerfil: 'View profile',
    cerrarSesion: 'Log out',
    volver: '← Back to general panel',
    atrasados: 'Overdue',
    proximos: 'Upcoming',
    ordenarPorFecha: 'Sort by date',
    buscarActividad: 'Search by activity name',
    sinActividades: 'You have no activities with a due date yet.',
    nuevoMensaje: 'New message',
    escribeUnMensaje: 'Write your message…',
    enviar: 'Send',
    elegirProfesor: 'Choose who to message',
    sinNotificaciones: 'You have no notifications.',
    sinMensajes: 'No messages in this conversation yet.',
    buscador: 'Search',
  },
};

const IdiomaContext = createContext(null);

export const IdiomaProvider = ({ children }) => {
  const [idioma, setIdioma] = useState(() => {
    try {
      return localStorage.getItem('av_idioma') || 'es';
    } catch {
      return 'es';
    }
  });

  const cambiarIdioma = (nuevo) => {
    setIdioma(nuevo);
    try {
      localStorage.setItem('av_idioma', nuevo);
    } catch {
      // localStorage puede fallar (modo privado, etc.) — no es crítico, el
      // idioma solo no persiste entre sesiones.
    }
  };

  const t = (clave) => DICCIONARIO[idioma]?.[clave] ?? DICCIONARIO.es[clave] ?? clave;

  return (
    <IdiomaContext.Provider value={{ idioma, cambiarIdioma, t }}>
      {children}
    </IdiomaContext.Provider>
  );
};

export const useIdioma = () => {
  const ctx = useContext(IdiomaContext);
  if (!ctx) throw new Error('useIdioma debe usarse dentro de <IdiomaProvider>');
  return ctx;
};
