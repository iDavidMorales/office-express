/*
 * Catálogo editable de Office Express.
 * Para agregar enlaces, agrega un objeto con id, section, name, desc, url,
 * color e icon. Una section nueva crea automáticamente otro grupo visual.
 * Iconos disponibles: doc, sheet, slide, drive, mail, calendar, meet, form,
 * keep, muse, design, scissors y link.
 */
window.OFFICE_APPS = [
  { id: 'docs', section: 'Google Workspace', name: 'Documentos', desc: 'Escribe y edita documentos', url: 'https://docs.google.com/document/u/0/', color: '#0e7490', icon: 'doc' },
  { id: 'sheets', section: 'Google Workspace', name: 'Hojas de cálculo', desc: 'Tablas y cálculos', url: 'https://sheets.google.com/', color: '#0f766e', icon: 'sheet' },
  { id: 'slides', section: 'Google Workspace', name: 'Presentaciones', desc: 'Diapositivas', url: 'https://slides.google.com/', color: '#155e75', icon: 'slide' },
  { id: 'drive', section: 'Google Workspace', name: 'Drive', desc: 'Tus archivos en la nube', url: 'https://drive.google.com/', color: '#0b3d5c', icon: 'drive' },
  { id: 'gmail', section: 'Google Workspace', name: 'Gmail', desc: 'Tu correo', url: 'https://mail.google.com/', color: '#b45309', icon: 'mail' },
  { id: 'calendar', section: 'Google Workspace', name: 'Calendar', desc: 'Agenda y recordatorios', url: 'https://calendar.google.com/', color: '#1d4ed8', icon: 'calendar' },
  { id: 'meet', section: 'Google Workspace', name: 'Meet', desc: 'Videollamadas', url: 'https://meet.google.com/', color: '#047857', icon: 'meet' },
  { id: 'forms', section: 'Google Workspace', name: 'Formularios', desc: 'Encuestas y formularios', url: 'https://forms.google.com/', color: '#6d28d9', icon: 'form' },
  { id: 'keep', section: 'Google Workspace', name: 'Keep', desc: 'Notas rápidas', url: 'https://keep.google.com/', color: '#a16207', icon: 'keep' },
  { id: 'muse-api-team', section: 'Herramientas', name: 'Muse API Team', desc: 'Conecta tu IA al baúl', url: 'https://muse-api-team.vercel.app/', color: '#0f6b70', icon: 'muse' },
  { id: 'canva', section: 'Creatividad', name: 'Canva', desc: 'Diseña presentaciones y contenido', url: 'https://www.canva.com/', color: '#7d2ae8', icon: 'design' },
  { id: 'capcut', section: 'Creatividad', name: 'CapCut Web', desc: 'Edita videos en línea', url: 'https://www.capcut.com/editor', color: '#171717', icon: 'scissors' }
];
