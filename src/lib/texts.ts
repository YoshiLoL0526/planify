/**
 * Textos de UI en español, centralizados (docs/03 · RNF-10).
 * Cuando llegue la internacionalización, este módulo se sustituye por
 * un framework de traducciones sin tocar los componentes.
 */
export const texts = {
  app: {
    name: "Planify",
    tagline: "Planifica tus ideas de proyecto",
    description: "Planifica tus ideas de proyecto con notas y diagramas.",
  },
  common: {
    unexpectedError: "Ha ocurrido un error inesperado. Inténtalo de nuevo.",
    tooManyAttempts:
      "Demasiados intentos seguidos. Espera un minuto e inténtalo de nuevo.",
  },
  auth: {
    login: {
      title: "Entrar en Planify",
      subtitle: "Continúa donde lo dejaste.",
      email: "Email",
      password: "Contraseña",
      submit: "Entrar",
      noAccount: "¿No tienes cuenta?",
      createAccount: "Crea una",
    },
    register: {
      title: "Crear cuenta",
      subtitle: "Empieza a planificar tus ideas.",
      name: "Nombre",
      email: "Email",
      password: "Contraseña",
      passwordHint: "Mínimo 8 caracteres.",
      submit: "Crear cuenta",
      hasAccount: "¿Ya tienes cuenta?",
      signIn: "Inicia sesión",
      welcome: "¡Te damos la bienvenida a Planify!",
    },
    logout: "Cerrar sesión",
    sessionClosed: "Has cerrado la sesión.",
  },
  nav: {
    home: "Inicio",
    favorites: "Favoritos",
    recent: "Recientes",
    archived: "Archivados",
    profile: "Perfil",
    comingSoon: "Disponible en la próxima fase",
    userMenu: "Cuenta",
  },
  home: {
    greeting: (name: string) => `Hola, ${name}`,
    emptyTitle: "Todavía no tienes proyectos",
    emptyDescription:
      "En la siguiente fase podrás crear proyectos con notas y diagramas aquí mismo.",
    newProject: "Nuevo proyecto",
  },
} as const;
