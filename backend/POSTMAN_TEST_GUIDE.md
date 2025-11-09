# Guía de Pruebas en Postman - Avatar Endpoints

## 🔐 Paso 1: Autenticación

**Request:** POST Login
- URL: `http://localhost:9080/auth/login`
- Headers: `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "email": "admin@inclumap.com",
  "password": "tu_contraseña"
}
```

**Respuesta esperada:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": 1,
    "email": "admin@inclumap.com",
    "role_id": 1
  }
}
```

## 📤 Paso 2: Subir Avatar

**Request:** PUT Avatar
- URL: `http://localhost:9080/user/4/avatar`
- Headers: `Authorization: Bearer [access_token_del_paso_1]`
- Body: form-data
  - Key: `avatar` (tipo File)
  - Value: Selecciona imagen (JPG, PNG, GIF, WebP < 5MB)

**Respuesta esperada:**
```json
{
  "message": "Avatar actualizado exitosamente",
  "avatar_url": "https://res.cloudinary.com/inclumap/..."
}
```

## 🗑️ Paso 3: Eliminar Avatar

**Request:** DELETE Avatar
- URL: `http://localhost:9080/user/4/avatar`
- Headers: `Authorization: Bearer [access_token_del_paso_1]`
- Body: (vacío)

**Respuesta esperada:**
```json
{
  "message": "Avatar eliminado exitosamente"
}
```

## ⚠️ Errores Comunes

### 401 Unauthorized
- **Causa:** Token JWT inválido, expirado o no proporcionado
- **Solución:** Hacer login nuevo y usar el token fresco

### 403 Forbidden
- **Causa:** Usuario sin permisos para modificar este avatar
- **Solución:** 
  - Si eres user_id 4, asegúrate de estar autenticado como user_id 4
  - O usar cuenta de administrador (role_id: 1)

### 400 Bad Request
- **Causa:** Archivo inválido o no proporcionado
- **Solución:** 
  - Verificar que el archivo sea imagen válida
  - Tamaño máximo 5MB
  - Formatos: JPG, PNG, GIF, WebP

### 404 Not Found
- **Causa:** Usuario no existe
- **Solución:** Verificar que el user_id existe en la base de datos

## 🎯 Casos de Prueba Específicos

1. **Admin actualiza avatar de cualquier usuario:**
   - Login como admin (role_id: 1)
   - PUT `/user/{cualquier_id}/avatar`
   - ✅ Debería funcionar

2. **Usuario actualiza su propio avatar:**
   - Login como user_id: 4
   - PUT `/user/4/avatar`
   - ✅ Debería funcionar

3. **Usuario intenta actualizar avatar de otro:**
   - Login como user_id: 4
   - PUT `/user/5/avatar`
   - ❌ Debería dar 403 Forbidden

4. **Archivo muy grande:**
   - Subir archivo > 5MB
   - ❌ Debería dar 400 Bad Request

5. **Archivo inválido:**
   - Subir PDF o TXT
   - ❌ Debería dar 400 Bad Request