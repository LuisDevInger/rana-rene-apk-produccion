# Configuración de Íconos de Aplicación

## Ícono Personalizado - Rana René

La aplicación móvil ahora usa el logo `LogoFerre.png` como ícono personalizado en lugar del ícono genérico de Android.

### 📱 Íconos Generados

Se han creado íconos en las siguientes densidades de pantalla de Android:

| Densidad | Tamaño | Ubicación |
|----------|--------|-----------|
| **mdpi** | 48x48px | `android/app/src/main/res/mipmap-mdpi/` |
| **hdpi** | 72x72px | `android/app/src/main/res/mipmap-hdpi/` |
| **xhdpi** | 96x96px | `android/app/src/main/res/mipmap-xhdpi/` |
| **xxhdpi** | 144x144px | `android/app/src/main/res/mipmap-xxhdpi/` |
| **xxxhdpi** | 192x192px | `android/app/src/main/res/mipmap-xxxhdpi/` |

### 📁 Archivos Creados

Para cada densidad, se generaron dos versiones:
- `ic_launcher.png` - Ícono cuadrado estándar
- `ic_launcher_round.png` - Ícono redondo para dispositivos compatibles

### ⚙️ Configuración en AndroidManifest.xml

```xml
<application
  android:name=".MainApplication"
  android:label="@string/app_name"
  android:icon="@mipmap/ic_launcher"
  android:roundIcon="@mipmap/ic_launcher_round"
  android:allowBackup="false"
  android:theme="@style/AppTheme">
```

### 🏷️ Nombre de la Aplicación

**strings.xml:**
```xml
<string name="app_name">Rana René - Control de Ventas</string>
```

**package.json:**
```json
"displayName": "Rana René - Control de Ventas"
```

### 🎨 Proceso de Generación

Los íconos se generaron automáticamente usando un script de PowerShell que:

1. **Lee** el logo original `LogoFerre.png`
2. **Redimensiona** la imagen a los tamaños requeridos usando .NET System.Drawing
3. **Guarda** las versiones redimensionadas en las carpetas mipmap correspondientes
4. **Mantiene** la calidad de imagen usando interpolación bicúbica

### 🔧 Script de Generación

```powershell
# Script usado para generar íconos
# resize-icons.ps1 (ya eliminado después del uso)

# Tamaños generados:
$iconSizes = @(
    @{ Name = "mipmap-mdpi"; Width = 48; Height = 48 },
    @{ Name = "mipmap-hdpi"; Width = 72; Height = 72 },
    @{ Name = "mipmap-xhdpi"; Width = 96; Height = 96 },
    @{ Name = "mipmap-xxhdpi"; Width = 144; Height = 144 },
    @{ Name = "mipmap-xxxhdpi"; Width = 192; Height = 192 }
)
```

### 📱 Resultado

Ahora cuando instales la aplicación en un dispositivo Android:

- **En el launcher:** Aparecerá el logo de Rana René en lugar del ícono genérico
- **En la barra de tareas:** Mostrará el ícono personalizado
- **En la Play Store:** Usará estos íconos para las diferentes densidades
- **En configuraciones:** El nombre "Rana René - Control de Ventas" aparecerá correctamente

### 🔄 Actualización Futura

Para cambiar el ícono en el futuro:

1. Reemplaza `LogoFerre.png` con la nueva imagen
2. Ejecuta el script de redimensionamiento nuevamente
3. Reconstruye la aplicación

### ✅ Verificación

Para verificar que los íconos funcionan correctamente:

1. **Instala** la aplicación en un dispositivo/emulador Android
2. **Revisa** que el ícono aparezca en el launcher
3. **Verifica** que el nombre "Rana René - Control de Ventas" aparezca correctamente
4. **Prueba** en diferentes densidades de pantalla

**¡La aplicación ahora tiene una identidad visual completa con el logo de Rana René!** 🎨📱
