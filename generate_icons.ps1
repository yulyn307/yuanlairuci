# 生成 PWA 图标 (使用 .NET 绘制)
Add-Type -AssemblyName System.Drawing

function New-AppIcon($size, $path) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = 'HighQuality'
    
    # 背景渐变
    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.Point(0, 0)),
        (New-Object System.Drawing.Point($size, $size)),
        [System.Drawing.Color]::FromArgb(99, 102, 241),
        [System.Drawing.Color]::FromArgb(34, 211, 238)
    )
    $g.FillRectangle($bgBrush, 0, 0, $size, $size)
    
    # 文字
    $fontSize = [int]($size * 0.45)
    $font = New-Object System.Drawing.Font('Segoe UI', $fontSize, [System.Drawing.FontStyle]::Bold)
    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = 'Center'
    $sf.LineAlignment = 'Center'
    $rect = New-Object System.Drawing.RectangleF(0, 0, $size, $size)
    $g.DrawString('En', $font, $textBrush, $rect, $sf)
    
    $g.Dispose()
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

New-AppIcon 192 '.\icons\icon-192.png'
New-AppIcon 512 '.\icons\icon-512.png'
Write-Host 'Icons generated!'
