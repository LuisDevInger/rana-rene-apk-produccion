# 🚀 Pasos para Build Android - React Native

## ✅ Problemas Arreglados

### 1. Firebase App ID Corregido
- ❌ Antes: `1:310457168785:web:44b0d6573e7ee70a3f2030`
- ✅ Ahora: `1:310457168785:android:44b0d6573e7ee70a3f2030`

### 2. Scripts de Build Agregados
```json
"build:android": "cd android && ./gradlew assembleRelease",
"build:apk": "cd android && ./gradlew assembleRelease",
"clean:android": "cd android && ./gradlew clean"
```

### 3. Archivo google-services.json Creado
- Ubicación: `android/app/google-services.json`
- Configurado con credenciales correctas

---

## 🎯 Pasos para Build

### Paso 1: Instalar Dependencias
```bash
cd ControlVentasRN
npm install
```

### Paso 2: Limpiar Build (Opcional)
```bash
npm run clean:android
```

### Paso 3: Build APK Release
```bash
npm run build:apk
```

### Paso 4: Encontrar el APK
El APK se generará en:
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## 🔧 Solución de Problemas

### Error: "SDK location not found"
**Solución:**
1. Instalar Android Studio
2. Configurar ANDROID_HOME:
```bash
setx ANDROID_HOME "C:\Users\[TU_USUARIO]\AppData\Local\Android\Sdk"
```

### Error: "JAVA_HOME not found"
**Solución:**
1. Instalar JDK 17
2. Configurar JAVA_HOME:
```bash
setx JAVA_HOME "C:\Program Files\Java\jdk-17"
```

### Error: "React Native version mismatch"
**Solución:**
```bash
npm install
cd android && ./gradlew clean
```

### Error: "Firebase App ID"
**Solución:** Ya está corregido en `src/services/firebase.ts`

---

## 📱 Probar en Dispositivo/Emulador

### Opción A: Emulador
```bash
npm run android
```

### Opción B: Dispositivo Físico
1. Habilitar "Depuración USB" en el dispositivo
2. Conectar por USB
3. Aceptar fingerprint
4. Ejecutar: `npm run android`

---

## ⚙️ Configuración Requerida

### JDK 17
```bash
java -version
# Debe mostrar: Java 17.x.x
```

### Android SDK (API 33+)
```bash
echo %ANDROID_HOME%
# Debe apuntar a: C:\Users\[usuario]\AppData\Local\Android\Sdk
```

### Node.js 20+
```bash
node --version
# Debe ser 20.x.x o superior
```

---

## 📋 Checklist Final

- [ ] JDK 17 instalado y configurado
- [ ] Android SDK instalado (API 33+)
- [ ] Node.js 20+ instalado
- [ ] `npm install` ejecutado
- [ ] `npm run build:apk` exitoso
- [ ] APK generado en `android/app/build/outputs/apk/release/`

---

## 🚨 Si Sigue Fallando

### Verificar Logs Detallados
```bash
cd android
./gradlew assembleRelease --info
```

### Limpiar Todo y Reintentar
```bash
npm run clean:android
cd android
./gradlew clean
npm install
npm run build:apk
```

---

## 📞 Soporte

Si el build sigue fallando, verifica:
1. **Memoria disponible:** Al menos 4GB RAM libre
2. **Espacio en disco:** Al menos 5GB libres
3. **Antivirus:** Temporalmente deshabilitar durante el build
4. **Conexión:** Internet estable para descargar dependencias

¡Éxito con el build! 📱</contents>
</xai:function_call">Wrote contents to ControlVentasRN/PASOS_PARA_BUILD_ANDROID.md.
