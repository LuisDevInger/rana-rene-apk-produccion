# Script para redimensionar el logo a diferentes tamaños para íconos de Android
param(
    [string]$sourceImage = "android\app\src\main\res\drawable\logo_ferre.png"
)

Add-Type -AssemblyName System.Drawing

function Resize-Image {
    param(
        [string]$inputFile,
        [string]$outputFile,
        [int]$width,
        [int]$height
    )

    try {
        $image = [System.Drawing.Image]::FromFile($inputFile)
        $bitmap = New-Object System.Drawing.Bitmap $width, $height

        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.DrawImage($image, 0, 0, $width, $height)

        $bitmap.Save($outputFile, [System.Drawing.Imaging.ImageFormat]::Png)
        $bitmap.Dispose()
        $image.Dispose()
        $graphics.Dispose()

        Write-Host "Created $outputFile (${width}x${height})"
    }
    catch {
        Write-Error "Error resizing image: $_"
    }
}

# Verificar que el archivo fuente existe
if (!(Test-Path $sourceImage)) {
    Write-Error "Source image not found: $sourceImage"
    exit 1
}

# Crear directorios si no existen
$dirs = @(
    "android\app\src\main\res\mipmap-mdpi",
    "android\app\src\main\res\mipmap-hdpi",
    "android\app\src\main\res\mipmap-xhdpi",
    "android\app\src\main\res\mipmap-xxhdpi",
    "android\app\src\main\res\mipmap-xxxhdpi"
)

foreach ($dir in $dirs) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
    }
}

# Redimensionar para cada densidad
$iconSizes = @(
    @{ Name = "mipmap-mdpi"; Width = 48; Height = 48 },
    @{ Name = "mipmap-hdpi"; Width = 72; Height = 72 },
    @{ Name = "mipmap-xhdpi"; Width = 96; Height = 96 },
    @{ Name = "mipmap-xxhdpi"; Width = 144; Height = 144 },
    @{ Name = "mipmap-xxxhdpi"; Width = 192; Height = 192 }
)

foreach ($size in $iconSizes) {
    $outputPath = "android\app\src\main\res\$($size.Name)\ic_launcher.png"
    Resize-Image -inputFile $sourceImage -outputFile $outputPath -width $size.Width -height $size.Height

    $outputPathRound = "android\app\src\main\res\$($size.Name)\ic_launcher_round.png"
    Resize-Image -inputFile $sourceImage -outputFile $outputPathRound -width $size.Width -height $size.Height
}

Write-Host "All Android icons created successfully!"
