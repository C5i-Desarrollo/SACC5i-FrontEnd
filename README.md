# RPSP - Frontend

Registro de Personal de Seguridad Publica - Aplicación Frontend desarrollada con React + Vite.

## 🚀 Tecnologías

- **React 18.3** - Librería UI
- **Vite 6.0** - Build tool y dev server
- **React Router DOM 7.12** - Routing
- **Axios 1.13** - Cliente HTTP
- **Boxicons** - Iconografía

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── auth/           # Componentes de autenticación y permisos
│   ├── layout/         # Componentes de layout (Navbar, Sidebar, MainContent)
│   └── ui/             # Componentes UI reutilizables
├── constants/          # Constantes y enums centralizados
│   ├── roles.js        # Definición de roles del sistema
│   ├── permissions.js  # Permisos y validaciones
│   └── tramites.js     # Constantes de trámites
├── context/            # React Context (Auth, Notifications)
├── hooks/              # Custom hooks reutilizables
│   ├── usePermissions.js
│   ├── useApi.js
│   ├── useFetch.js
│   ├── useForm.js
│   └── ...
├── pages/              # Páginas/vistas de la aplicación
│   ├── Login/
│   ├── Dashboard/
│   ├── Tramites/
│   └── ...
├── routes/             # Configuración de rutas
│   ├── routesConfig.js
│   └── ProtectedRouter.jsx
├── services/           # Servicios API
│   └── api.js
├── utils/              # Utilidades y helpers
│   ├── validators.js   # Validaciones
│   ├── formatters.js   # Formateo de datos
│   ├── helpers.js      # Funciones auxiliares
│   └── errorHandler.js # Manejo de errores
└── styles/             # Estilos globales

```

## 🔧 Instalación y Configuración

### 1. Clonar e instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copiar `.env.example` a `.env` y configurar:

```bash
cp .env.example .env
```

Variables principales:
```env
VITE_API_URL=http://localhost:5000/api
VITE_ENV=development
```

### 3. Ejecutar en desarrollo

```bash
npm run dev
```

La aplicación estará disponible en: `http://localhost:3000`

### 4. Build para producción

```bash
npm run build
```

Los archivos optimizados se generarán en `/dist`

## 🎯 Características Principales

### ✅ Arquitectura Escalable

- **Separación de responsabilidades** - Cada módulo tiene una función específica
- **Constantes centralizadas** - Sin strings hardcoded
- **Custom hooks** - Lógica reutilizable
- **Path aliases** - Imports limpios con `@/`

### ✅ Sistema de Permisos Robusto

```jsx
import { usePermissions } from '@hooks/usePermissions';
import { PERMISSIONS } from '@constants/permissions';

function MiComponente() {
  const { can } = usePermissions();
  
  return (
    <>
      {can(PERMISSIONS.VIEW_USUARIOS) && <ButtonUsuarios />}
    </>
  );
}
```

### ✅ Manejo de Errores Centralizado

```jsx
import { useApi } from '@hooks/useApi';
import { getUsuarios } from '@services/api';

function ListaUsuarios() {
  const { data, loading, error, execute } = useApi(getUsuarios);
  
  // Errores manejados automáticamente
}
```

### ✅ Validación de Formularios

```jsx
import { useForm } from '@hooks/useForm';

function FormularioAlta() {
  const { values, errors, handleChange, handleSubmit } = useForm(
    initialValues,
    {
      curp: { required: true, curp: true },
      rfc: { required: true, rfc: true },
      nombre: { required: true, minLength: 2 }
    }
  );
}
```

### ✅ Sistema de Notificaciones

```jsx
import { useNotification } from '@context/NotificationContext';

function MiComponente() {
  const { success, error, warning } = useNotification();
  
  const guardar = async () => {
    try {
      await api.guardar();
      success('Guardado exitosamente');
    } catch (err) {
      error('Error al guardar');
    }
  };
}
```

## 👥 Roles del Sistema

- **Super Admin** - Acceso total
- **Admin** - Gestión de usuarios y trámites
- **Analista C5** - Gestión de altas, bajas, consultas
- **Validador C3** - Validación de personas
- **Dependencia** - Consulta y trámites propios

## 🛡️ Buenas Prácticas Implementadas

✅ **No strings mágicos** - Todo en constantes  
✅ **Permisos centralizados** - Seguridad consistente  
✅ **Custom hooks** - Lógica reutilizable  
✅ **Lazy loading** - Mejor performance  
✅ **Error handling** - UX mejorada  
✅ **Validaciones** - Datos consistentes  
✅ **Path aliases** - Imports limpios  
✅ **JSDoc** - Documentación en código  

## 📝 Convenciones de Código

### Imports con path aliases

```jsx
// ✅ Correcto
import { ROLES } from '@constants/roles';
import { usePermissions } from '@hooks/usePermissions';
import Button from '@components/ui/Button';

// ❌ Evitar
import { ROLES } from '../../../constants/roles';
```

### Uso de constantes

```jsx
// ✅ Correcto
import { ROLES } from '@constants/roles';
if (user.rol === ROLES.ADMIN) { }

// ❌ Evitar
if (user.rol === 'admin') { }
```

### Validaciones

```jsx
// ✅ Correcto
import { isValidCURP } from '@utils/validators';
if (!isValidCURP(curp)) { }

// ❌ Evitar
if (!/^[A-Z]{4}\d{6}.../.test(curp)) { }
```

## 🔄 Flujo de Trabajo Git

```bash
# Actualizar main
git checkout main
git pull

# Crear rama de feature
git checkout -b feature/nombre-feature

# Commit de cambios
git add .
git commit -m "feat: descripción del cambio"

# Merge a develop-front
git checkout develop-front
git merge feature/nombre-feature

# Push
git push origin develop-front
```

## 🐛 Troubleshooting

### Error: Cannot find module '@/...'

```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

### Build falla en producción

```bash
# Verificar variables de entorno
cat .env

# Build con más memoria
NODE_OPTIONS=--max-old-space-size=4096 npm run build
```

## 📚 Recursos Adicionales

- [Documentación React](https://react.dev/)
- [Documentación Vite](https://vitejs.dev/)
- [React Router](https://reactrouter.com/)

## 👨‍💻 Desarrollo

Para agregar nuevas features, seguir la estructura establecida:

1. Agregar constantes en `/constants`
2. Crear utilidades en `/utils`
3. Crear custom hooks en `/hooks` si es necesario
4. Implementar componentes en `/components` o `/pages`
5. Usar el sistema de notificaciones
6. Validar permisos con `usePermissions`

---

**Versión:** 1.0.0  
**Fecha:** Febrero 2026