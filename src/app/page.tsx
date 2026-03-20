'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'

type Tool = 'none' | 'resize' | 'compress' | 'format' | 'rotate' | 'crop' | 'background' | 'filters' | 'batch' | 'enhance' | 'watermark'

interface ImageState {
  original: string | null
  processed: string | null
  width: number
  height: number
  fileSize: number
  compressedSize: number | null
  history: string[]
}

export default function Home() {
  const [image, setImage] = useState<ImageState>({
    original: null,
    processed: null,
    width: 0,
    height: 0,
    fileSize: 0,
    compressedSize: null,
    history: [],
  })
  const [activeTool, setActiveTool] = useState<Tool>('none')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusText, setStatusText] = useState('')

  // Resize options
  const [newWidth, setNewWidth] = useState(800)
  const [newHeight, setNewHeight] = useState(600)
  const [keepRatio, setKeepRatio] = useState(true)

  // Compress options
  const [quality, setQuality] = useState(80)
  const [outputFormat, setOutputFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp'>('image/jpeg')
  
  // Convert image format
  const convertImage = (format: 'image/png' | 'image/jpeg' | 'image/webp') => {
    if (!image.original) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new window.Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          setImage(prev => ({ 
            ...prev, 
            processed: url
          }))
        }
      }, format)
    }
    img.src = image.original
  }

  // Background options
  const [bgColor, setBgColor] = useState('#ffffff')
  const presetColors = ['#ffffff', '#000000', '#ef4444', '#22c55e', '#3b82f6', '#eab308', '#6b7280']
  
  // Rotation options
  const [rotation, setRotation] = useState(0)
  const rotationOptions = [0, 90, 180, 270]
  
  // Filter options
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [saturation, setSaturation] = useState(100)
  const [blur, setBlur] = useState(0)
  const [grayscale, setGrayscale] = useState(0)
  const [sepia, setSepia] = useState(0)
  
  const filterPresets = [
    { name: '原图', brightness: 100, contrast: 100, saturation: 100, blur: 0, grayscale: 0, sepia: 0 },
    { name: '黑白', brightness: 100, contrast: 100, saturation: 0, blur: 0, grayscale: 100, sepia: 0 },
    { name: '复古', brightness: 110, contrast: 90, saturation: 80, blur: 0, grayscale: 0, sepia: 30 },
    { name: '鲜艳', brightness: 100, contrast: 120, saturation: 150, blur: 0, grayscale: 0, sepia: 0 },
    { name: '暗调', brightness: 80, contrast: 110, saturation: 90, blur: 0, grayscale: 0, sepia: 0 },
    { name: '模糊', brightness: 100, contrast: 100, saturation: 100, blur: 5, grayscale: 0, sepia: 0 },
  ]

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle image upload
  const handleUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件')
      return
    }

    // Check file size (20MB limit)
    if (file.size > 20 * 1024 * 1024) {
      alert('文件大小不能超过 20MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new window.Image()
      img.onload = () => {
        if (!validateImage(img)) return
        
        setImage({
          original: e.target?.result as string,
          processed: null,
          width: img.naturalWidth,
          height: img.naturalHeight,
          fileSize: file.size,
          compressedSize: null,
          history: [],
        })
        setNewWidth(img.naturalWidth)
        setNewHeight(img.naturalHeight)
        setActiveTool('none')
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }, [])

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
  }

  // Validate image before processing
  const validateImage = (img: HTMLImageElement): boolean => {
    if (img.naturalWidth === 0 || img.naturalHeight === 0) {
      alert('图片尺寸无效')
      return false
    }
    
    // Check if image is too large for processing
    if (img.naturalWidth > 4000 || img.naturalHeight > 4000) {
      alert('图片尺寸过大，请选择小于 4000x4000 的图片')
      return false
    }
    
    return true
  }

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }, [handleUpload])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // Simple background removal using canvas (basic chroma key approach)
  const removeBackground = async () => {
    if (!image.original) return

    setIsProcessing(true)
    setProgress(0)
    setStatusText('正在处理图片...')
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('Processing error:', error)
      setStatusText('处理失败')
      setIsProcessing(false)
      return
    }

    try {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      
      await new Promise<void>((resolve) => {
        img.onload = () => resolve()
        img.src = image.original!
      })

      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      // Simple background removal: detect and remove dominant background color
      // This is a basic approach - for better results, use AI-based solutions
      
      // Sample corners to detect background color
      const corners = [
        { x: 0, y: 0 },
        { x: canvas.width - 1, y: 0 },
        { x: 0, y: canvas.height - 1 },
        { x: canvas.width - 1, y: canvas.height - 1 },
      ]

      let r = 0, g = 0, b = 0
      corners.forEach(({ x, y }) => {
        const i = (y * canvas.width + x) * 4
        r += data[i]
        g += data[i + 1]
        b += data[i + 2]
      })
      r = Math.round(r / 4)
      g = Math.round(g / 4)
      b = Math.round(b / 4)

      const threshold = 60

      for (let i = 0; i < data.length; i += 4) {
        const dr = Math.abs(data[i] - r)
        const dg = Math.abs(data[i + 1] - g)
        const db = Math.abs(data[i + 2] - b)
        
        if (dr < threshold && dg < threshold && db < threshold) {
          data[i + 3] = 0 // Set alpha to 0 (transparent)
        }
        
        if (i % 10000 === 0) {
          setProgress(Math.round((i / data.length) * 100))
        }
      }

      ctx.putImageData(imageData, 0, 0)
      const url = canvas.toDataURL('image/png')
      
      addToHistory(url)
      setStatusText('背景移除完成!')
      setProgress(100)
    } catch (error) {
      console.error('Background removal error:', error)
      setStatusText('处理失败，请重试')
    } finally {
      setIsProcessing(false)
    }
  }

  // Resize image
  const resizeImage = () => {
    if (!image.original) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new window.Image()
    img.onload = () => {
      canvas.width = newWidth
      canvas.height = newHeight
      ctx.drawImage(img, 0, 0, newWidth, newHeight)
      const url = canvas.toDataURL('image/png')
      setImage(prev => ({ 
        ...prev, 
        processed: url,
        width: newWidth,
        height: newHeight
      }))
    }
    img.src = image.original
  }

  // Compress image
  const compressImage = () => {
    if (!image.original) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new window.Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          setImage(prev => ({ 
            ...prev, 
            processed: url,
            compressedSize: blob.size
          }))
        }
      }, outputFormat, quality / 100)
    }
    img.src = image.original
  }

  // Replace background
  const replaceBackground = (color: string) => {
    if (!image.processed) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new window.Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      
      // Fill background
      ctx.fillStyle = color
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Draw image on top
      ctx.drawImage(img, 0, 0)
      
      const url = canvas.toDataURL('image/png')
      setImage(prev => ({ ...prev, processed: url }))
    }
    img.src = image.processed
    setBgColor(color)
  }

  // Rotate image
  const rotateImage = (degrees: number) => {
    if (!image.original) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new window.Image()
    img.onload = () => {
      const radians = (degrees * Math.PI) / 180
      const sin = Math.abs(Math.sin(radians))
      const cos = Math.abs(Math.cos(radians))
      
      canvas.width = img.width * cos + img.height * sin
      canvas.height = img.width * sin + img.height * cos
      
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate(radians)
      ctx.drawImage(img, -img.width / 2, -img.height / 2)
      
      const url = canvas.toDataURL('image/png')
      setImage(prev => ({ 
        ...prev, 
        processed: url,
        width: canvas.width,
        height: canvas.height
      }))
      setRotation(degrees)
    }
    img.src = image.original
  }

  // Apply filters
  const applyFilters = () => {
    if (!image.original) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new window.Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      
      // Apply CSS filters
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px) grayscale(${grayscale}%) sepia(${sepia}%)`
      
      ctx.drawImage(img, 0, 0)
      
      const url = canvas.toDataURL('image/png')
      addToHistory(url)
    }
    img.src = image.original
  }

  // Apply filter preset
  const applyFilterPreset = (preset: typeof filterPresets[0]) => {
    setBrightness(preset.brightness)
    setContrast(preset.contrast)
    setSaturation(preset.saturation)
    setBlur(preset.blur)
    setGrayscale(preset.grayscale)
    setSepia(preset.sepia)
    
    setTimeout(() => applyFilters(), 100)
  }

  // Reset filters
  const resetFilters = () => {
    setBrightness(100)
    setContrast(100)
    setSaturation(100)
    setBlur(0)
    setGrayscale(0)
    setSepia(0)
    
    if (image.original) {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const img = new window.Image()
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        
        const url = canvas.toDataURL('image/png')
        addToHistory(url)
      }
      img.src = image.original
    }
  }

  // Batch processing state
  const [batchImages, setBatchImages] = useState<File[]>([])
  const [batchProcessing, setBatchProcessing] = useState(false)
  const [batchProgress, setBatchProgress] = useState(0)
  
  // Enhancement options
  const [sharpen, setSharpen] = useState(0)
  const [noiseReduction, setNoiseReduction] = useState(0)
  const [vignette, setVignette] = useState(0)
  const [exposure, setExposure] = useState(100)
  
  const enhancementPresets = [
    { name: '原图', sharpen: 0, noiseReduction: 0, vignette: 0, exposure: 100 },
    { name: '清晰', sharpen: 50, noiseReduction: 30, vignette: 0, exposure: 110 },
    { name: '专业', sharpen: 30, noiseReduction: 50, vignette: 20, exposure: 105 },
    { name: '艺术', sharpen: 20, noiseReduction: 20, vignette: 40, exposure: 120 },
    { name: '暗调', sharpen: 10, noiseReduction: 40, vignette: 60, exposure: 80 },
  ]

  // Handle batch file upload
  const handleBatchUpload = (files: FileList) => {
    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/') && file.size <= 20 * 1024 * 1024
    )
    
    if (imageFiles.length === 0) {
      alert('请上传有效的图片文件（最大 20MB）')
      return
    }
    
    if (imageFiles.length > 10) {
      alert('一次最多处理 10 张图片')
      return
    }
    
    setBatchImages(imageFiles)
  }

  // Process batch images
  const processBatch = async () => {
    if (batchImages.length === 0) return
    
    setBatchProcessing(true)
    setBatchProgress(0)
    
    const processedImages: string[] = []
    
    for (let i = 0; i < batchImages.length; i++) {
      const file = batchImages[i]
      const reader = new FileReader()
      
      await new Promise<void>((resolve) => {
        reader.onload = (e) => {
          const img = new window.Image()
          img.onload = () => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            
            if (ctx) {
              canvas.width = img.width
              canvas.height = img.height
              
              // Apply current filters
              ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px) grayscale(${grayscale}%) sepia(${sepia}%)`
              ctx.drawImage(img, 0, 0)
              
              const url = canvas.toDataURL('image/png')
              processedImages.push(url)
            }
            
            resolve()
          }
          img.src = e.target?.result as string
        }
        reader.readAsDataURL(file)
      })
      
      setBatchProgress(Math.round(((i + 1) / batchImages.length) * 100))
    }
    
    // Download all images individually
    if (processedImages.length > 0) {
      processedImages.forEach((url, index) => {
        const a = document.createElement('a')
        a.href = url
        a.download = `processed-image-${index + 1}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      })
    }
    
    setBatchProcessing(false)
    setBatchImages([])
  }

  // Apply image enhancement
  const applyEnhancement = () => {
    if (!image.original) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new window.Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      
      // Apply basic filters
      ctx.filter = `brightness(${exposure}%) contrast(${contrast}%) saturate(${saturation}%)`
      ctx.drawImage(img, 0, 0)
      
      // Apply sharpen
      if (sharpen > 0) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        const factor = sharpen / 100
        
        for (let i = 0; i < data.length; i += 4) {
          if (i > 4 && i < data.length - 8) {
            data[i] = data[i] * (1 + factor) - data[i - 4] * factor / 2 - data[i + 4] * factor / 2
            data[i + 1] = data[i + 1] * (1 + factor) - data[i - 3] * factor / 2 - data[i + 5] * factor / 2
            data[i + 2] = data[i + 2] * (1 + factor) - data[i - 2] * factor / 2 - data[i + 6] * factor / 2
          }
        }
        ctx.putImageData(imageData, 0, 0)
      }
      
      // Apply vignette
      if (vignette > 0) {
        const gradient = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, 0,
          canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
        )
        gradient.addColorStop(0, `rgba(0, 0, 0, 0)`)
        gradient.addColorStop(1, `rgba(0, 0, 0, ${vignette / 100})`)
        
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      
      const url = canvas.toDataURL('image/png')
      addToHistory(url)
    }
    img.src = image.original
  }

  // Apply enhancement preset
  const applyEnhancementPreset = (preset: typeof enhancementPresets[0]) => {
    setSharpen(preset.sharpen)
    setNoiseReduction(preset.noiseReduction)
    setVignette(preset.vignette)
    setExposure(preset.exposure)
    
    setTimeout(() => applyEnhancement(), 100)
  }

  // Reset enhancement
  const resetEnhancement = () => {
    setSharpen(0)
    setNoiseReduction(0)
    setVignette(0)
    setExposure(100)
    
    if (image.original) {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const img = new window.Image()
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        
        const url = canvas.toDataURL('image/png')
        addToHistory(url)
      }
      img.src = image.original
    }
  }

  // Watermark options
  const [watermarkText, setWatermarkText] = useState('')
  const [watermarkSize, setWatermarkSize] = useState(20)
  const [watermarkColor, setWatermarkColor] = useState('#ffffff')
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.7)
  const [watermarkPosition, setWatermarkPosition] = useState('bottom-right')
  
  const watermarkPositions = [
    { value: 'top-left', label: '左上' },
    { value: 'top-right', label: '右上' },
    { value: 'bottom-left', label: '左下' },
    { value: 'bottom-right', label: '右下' },
    { value: 'center', label: '居中' },
  ]

  // Apply watermark
  const applyWatermark = () => {
    if (!image.original || !watermarkText) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new window.Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      
      // Draw original image
      ctx.drawImage(img, 0, 0)
      
      // Set watermark style
      ctx.font = `${watermarkSize}px Arial`
      ctx.fillStyle = watermarkColor
      ctx.globalAlpha = watermarkOpacity
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      // Calculate position
      let x, y
      const padding = 20
      const textMetrics = ctx.measureText(watermarkText)
      const textWidth = textMetrics.width
      const textHeight = watermarkSize
      
      switch (watermarkPosition) {
        case 'top-left':
          x = padding + textWidth / 2
          y = padding + textHeight / 2
          ctx.textAlign = 'left'
          break
        case 'top-right':
          x = canvas.width - padding - textWidth / 2
          y = padding + textHeight / 2
          ctx.textAlign = 'right'
          break
        case 'bottom-left':
          x = padding + textWidth / 2
          y = canvas.height - padding - textHeight / 2
          ctx.textAlign = 'left'
          break
        case 'bottom-right':
          x = canvas.width - padding - textWidth / 2
          y = canvas.height - padding - textHeight / 2
          ctx.textAlign = 'right'
          break
        case 'center':
          x = canvas.width / 2
          y = canvas.height / 2
          break
        default:
          x = canvas.width - padding - textWidth / 2
          y = canvas.height - padding - textHeight / 2
          ctx.textAlign = 'right'
      }
      
      // Draw watermark
      ctx.fillText(watermarkText, x, y)
      
      // Reset alpha
      ctx.globalAlpha = 1
      
      const url = canvas.toDataURL('image/png')
      addToHistory(url)
    }
    img.src = image.original
  }

  // Crop image
  const cropImage = (x: number, y: number, width: number, height: number) => {
    if (!image.original) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new window.Image()
    img.onload = () => {
      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, x, y, width, height, 0, 0, width, height)
      
      const url = canvas.toDataURL('image/png')
      setImage(prev => ({ 
        ...prev, 
        processed: url,
        width: width,
        height: height
      }))
    }
    img.src = image.original
  }

  // Download image
  const downloadImage = () => {
    const url = image.processed || image.original
    if (!url) return

    const a = document.createElement('a')
    a.href = url
    a.download = `edited-image-${Date.now()}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  // Undo last edit
  const undoEdit = () => {
    if (image.history.length > 0) {
      const previousState = image.history[image.history.length - 1]
      setImage(prev => ({
        ...prev,
        processed: prev.history.length > 1 ? prev.history[prev.history.length - 2] : null,
        history: prev.history.slice(0, -1)
      }))
    }
  }

  // Add to history
  const addToHistory = (url: string) => {
    setImage(prev => ({
      ...prev,
      history: [...prev.history, prev.processed || prev.original || ''],
      processed: url
    }))
  }

  // Reset
  const resetImage = () => {
    if (confirm('确定要重置吗？所有编辑将被清除。')) {
      setImage(prev => ({
        ...prev,
        processed: null,
        compressedSize: null,
        history: []
      }))
      setActiveTool('none')
    }
  }

  // Handle width change with ratio
  const handleWidthChange = (value: number) => {
    setNewWidth(value)
    if (keepRatio && image.width > 0) {
      setNewHeight(Math.round(value * image.height / image.width))
    }
  }

  const handleHeightChange = (value: number) => {
    setNewHeight(value)
    if (keepRatio && image.height > 0) {
      setNewWidth(Math.round(value * image.width / image.height))
    }
  }

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-slate-800">
            🎨 Image Bianji
          </h1>
          <p className="text-slate-500 text-sm">调整尺寸 · 压缩图片 · 替换背景</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Upload Area */}
        {!image.original ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className="border-3 border-dashed border-blue-300 rounded-2xl p-20 text-center cursor-pointer
                       bg-white/50 hover:bg-blue-50 hover:border-blue-400 transition-all duration-200"
          >
            <div className="text-6xl mb-4">📷</div>
            <p className="text-xl text-slate-600 mb-2">拖拽图片到这里</p>
            <p className="text-slate-400">或点击选择文件</p>
            <p className="text-slate-400 text-sm mt-2">支持 JPG、PNG、WebP，最大 20MB</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Preview Area */}
            <div className="lg:col-span-2 space-y-4">
              {/* Image Preview */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-700">预览</h2>
                  <div className="flex gap-2 text-sm text-slate-500">
                    <span>{image.width} × {image.height}</span>
                    <span>·</span>
                    <span>{formatSize(image.fileSize)}</span>
                    {image.compressedSize && (
                      <>
                        <span>→</span>
                        <span className="text-green-600">{formatSize(image.compressedSize)}</span>
                        <span className="text-green-600">
                          (节省 {Math.round((1 - image.compressedSize / image.fileSize) * 100)}%)
                        </span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="checkerboard rounded-lg overflow-hidden flex items-center justify-center min-h-[400px]">
                  {image.processed ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image.processed}
                      alt="Processed"
                      className="max-w-full max-h-[500px] object-contain"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image.original}
                      alt="Original"
                      className="max-w-full max-h-[500px] object-contain"
                    />
                  )}
                </div>
              </div>

              {/* Progress */}
              {isProcessing && (
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">{statusText}</span>
                    <span className="text-sm font-medium text-blue-600">{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={removeBackground}
                  disabled={isProcessing}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl
                           font-medium hover:from-purple-600 hover:to-pink-600 disabled:opacity-50
                           disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  ✂️ 移除背景
                </button>
                <button
                  onClick={() => setActiveTool(activeTool === 'resize' ? 'none' : 'resize')}
                  className="px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl
                           font-medium hover:bg-slate-50 transition-all shadow-sm"
                >
                  📐 调整尺寸
                </button>
                <button
                  onClick={() => setActiveTool(activeTool === 'compress' ? 'none' : 'compress')}
                  className="px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl
                           font-medium hover:bg-slate-50 transition-all shadow-sm"
                >
                  🗜️ 压缩图片
                </button>
                <button
                  onClick={() => setActiveTool(activeTool === 'format' ? 'none' : 'format')}
                  className="px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl
                           font-medium hover:bg-slate-50 transition-all shadow-sm"
                >
                  🔄 转换格式
                </button>
                <button
                  onClick={() => setActiveTool(activeTool === 'rotate' ? 'none' : 'rotate')}
                  className="px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl
                           font-medium hover:bg-slate-50 transition-all shadow-sm"
                >
                  🔄 旋转
                </button>
                <button
                  onClick={() => setActiveTool(activeTool === 'crop' ? 'none' : 'crop')}
                  className="px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl
                           font-medium hover:bg-slate-50 transition-all shadow-sm"
                >
                  ✂️ 裁剪
                </button>
                <button
                  onClick={() => setActiveTool(activeTool === 'filters' ? 'none' : 'filters')}
                  className="px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl
                           font-medium hover:bg-slate-50 transition-all shadow-sm"
                >
                  🎨 滤镜
                </button>
                <button
                  onClick={() => setActiveTool(activeTool === 'batch' ? 'none' : 'batch')}
                  className="px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl
                           font-medium hover:bg-slate-50 transition-all shadow-sm"
                >
                  📦 批量处理
                </button>
                <button
                  onClick={() => setActiveTool(activeTool === 'enhance' ? 'none' : 'enhance')}
                  className="px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl
                           font-medium hover:bg-slate-50 transition-all shadow-sm"
                >
                  ✨ 图片增强
                </button>
                <button
                  onClick={() => setActiveTool(activeTool === 'watermark' ? 'none' : 'watermark')}
                  className="px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl
                           font-medium hover:bg-slate-50 transition-all shadow-sm"
                >
                  🏷️ 添加水印
                </button>
                <button
                  onClick={() => image.processed && setActiveTool(activeTool === 'background' ? 'none' : 'background')}
                  disabled={!image.processed}
                  className="px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl
                           font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all shadow-sm"
                >
                  🎨 替换背景
                </button>
              </div>

              {/* Bottom Actions */}
              <div className="flex gap-3">
                <button
                  onClick={downloadImage}
                  disabled={!image.original}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl
                           font-medium hover:from-green-600 hover:to-emerald-600 disabled:opacity-50
                           disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  ⬇️ 下载图片
                </button>
                <button
                  onClick={undoEdit}
                  disabled={image.history.length === 0}
                  className="px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl
                           font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all shadow-sm"
                >
                  ↩️ 撤销
                </button>
                <button
                  onClick={resetImage}
                  disabled={!image.processed}
                  className="px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl
                           font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all shadow-sm"
                >
                  🔄 重置
                </button>
                <button
                  onClick={() => {
                    setImage({ original: null, processed: null, width: 0, height: 0, fileSize: 0, compressedSize: null, history: [] })
                    setActiveTool('none')
                  }}
                  className="px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl
                           font-medium hover:bg-slate-50 transition-all shadow-sm"
                >
                  📤 上传新图片
                </button>
              </div>
            </div>

            {/* Tools Panel */}
            <div className="space-y-4">
              {/* Resize Panel */}
              {activeTool === 'resize' && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-700 mb-4">📐 调整尺寸</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">宽度 (px)</label>
                      <input
                        type="number"
                        value={newWidth}
                        onChange={(e) => handleWidthChange(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 
                                 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">高度 (px)</label>
                      <input
                        type="number"
                        value={newHeight}
                        onChange={(e) => handleHeightChange(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 
                                 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={keepRatio}
                        onChange={(e) => setKeepRatio(e.target.checked)}
                        className="rounded border-slate-300"
                      />
                      <span className="text-sm text-slate-600">保持宽高比</span>
                    </label>
                    <button
                      onClick={resizeImage}
                      className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                      应用
                    </button>
                  </div>
                </div>
              )}

              {/* Compress Panel */}
              {activeTool === 'compress' && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-700 mb-4">🗜️ 压缩图片</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">质量: {quality}%</label>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={quality}
                        onChange={(e) => setQuality(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">输出格式</label>
                      <select
                        value={outputFormat}
                        onChange={(e) => setOutputFormat(e.target.value as typeof outputFormat)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 
                                 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      >
                        <option value="image/jpeg">JPEG</option>
                        <option value="image/png">PNG</option>
                        <option value="image/webp">WebP</option>
                      </select>
                    </div>
                    <button
                      onClick={compressImage}
                      className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                      应用压缩
                    </button>
                  </div>
                </div>
              )}

              {/* Format Conversion Panel */}
              {activeTool === 'format' && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-700 mb-4">🔄 转换格式</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-600 mb-2">输出格式</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => convertImage('image/jpeg')}
                          className="py-3 px-4 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                        >
                          JPEG
                        </button>
                        <button
                          onClick={() => convertImage('image/png')}
                          className="py-3 px-4 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                        >
                          PNG
                        </button>
                        <button
                          onClick={() => convertImage('image/webp')}
                          className="py-3 px-4 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                        >
                          WebP
                        </button>
                      </div>
                    </div>
                    <div className="text-sm text-slate-500">
                      <p>• JPEG: 压缩率高，支持透明度</p>
                      <p>• PNG: 无损压缩，支持透明度</p>
                      <p>• WebP: 现代格式，体积小</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Rotation Panel */}
              {activeTool === 'rotate' && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-700 mb-4">🔄 旋转</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-600 mb-2">旋转角度</label>
                      <div className="grid grid-cols-4 gap-2">
                        {rotationOptions.map((angle) => (
                          <button
                            key={angle}
                            onClick={() => rotateImage(angle)}
                            className={`py-3 px-4 border rounded-lg transition ${
                              rotation === angle 
                                ? 'bg-blue-500 text-white border-blue-500' 
                                : 'border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            {angle}°
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="text-sm text-slate-500">
                      <p>• 旋转会改变图片尺寸</p>
                      <p>• 90°/270° 会交换宽高</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Crop Panel */}
              {activeTool === 'crop' && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-700 mb-4">✂️ 裁剪</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-600 mb-2">预设裁剪</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => cropImage(0, 0, image.width * 0.5, image.height)}
                          className="py-2 px-4 border border-slate-300 rounded-lg hover:bg-slate-50 transition text-sm"
                        >
                          左半边
                        </button>
                        <button
                          onClick={() => cropImage(image.width * 0.5, 0, image.width * 0.5, image.height)}
                          className="py-2 px-4 border border-slate-300 rounded-lg hover:bg-slate-50 transition text-sm"
                        >
                          右半边
                        </button>
                        <button
                          onClick={() => cropImage(0, 0, image.width, image.height * 0.5)}
                          className="py-2 px-4 border border-slate-300 rounded-lg hover:bg-slate-50 transition text-sm"
                        >
                          上半边
                        </button>
                        <button
                          onClick={() => cropImage(0, image.height * 0.5, image.width, image.height * 0.5)}
                          className="py-2 px-4 border border-slate-300 rounded-lg hover:bg-slate-50 transition text-sm"
                        >
                          下半边
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-2">自定义裁剪</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          placeholder="X"
                          className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Y"
                          className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        />
                        <input
                          type="number"
                          placeholder="宽度"
                          className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        />
                        <input
                          type="number"
                          placeholder="高度"
                          className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        // Simple demo crop - center crop to 80%
                        const centerX = image.width * 0.1
                        const centerY = image.height * 0.1
                        const cropWidth = image.width * 0.8
                        const cropHeight = image.height * 0.8
                        cropImage(centerX, centerY, cropWidth, cropHeight)
                      }}
                      className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                      居中裁剪 (80%)
                    </button>
                  </div>
                </div>
              )}

              {/* Filters Panel */}
              {activeTool === 'filters' && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-700 mb-4">🎨 滤镜</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-600 mb-2">滤镜预设</label>
                      <div className="grid grid-cols-2 gap-2">
                        {filterPresets.map((preset, index) => (
                          <button
                            key={index}
                            onClick={() => applyFilterPreset(preset)}
                            className="py-2 px-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition text-sm"
                          >
                            {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-slate-600 mb-2">亮度: {brightness}%</label>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={brightness}
                        onChange={(e) => setBrightness(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-slate-600 mb-2">对比度: {contrast}%</label>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={contrast}
                        onChange={(e) => setContrast(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-slate-600 mb-2">饱和度: {saturation}%</label>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={saturation}
                        onChange={(e) => setSaturation(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-slate-600 mb-2">模糊: {blur}px</label>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        value={blur}
                        onChange={(e) => setBlur(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-slate-600 mb-2">黑白: {grayscale}%</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={grayscale}
                        onChange={(e) => setGrayscale(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-slate-600 mb-2">复古: {sepia}%</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={sepia}
                        onChange={(e) => setSepia(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={applyFilters}
                        className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                      >
                        应用滤镜
                      </button>
                      <button
                        onClick={resetFilters}
                        className="flex-1 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                      >
                        重置
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Background Panel */}
              {activeTool === 'background' && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-700 mb-4">🎨 替换背景</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-600 mb-2">预设颜色</label>
                      <div className="flex flex-wrap gap-2">
                        {presetColors.map((color) => (
                          <button
                            key={color}
                            onClick={() => replaceBackground(color)}
                            className={`w-10 h-10 rounded-lg border-2 transition hover:scale-110 ${
                              bgColor === color ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-300'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">自定义颜色</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={bgColor}
                          onChange={(e) => setBgColor(e.target.value)}
                          className="w-12 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={bgColor}
                          onChange={(e) => setBgColor(e.target.value)}
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => replaceBackground(bgColor)}
                      className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                      应用背景
                    </button>
                  </div>
                </div>
              )}

               {/* Image Info Panel */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-700 mb-4">📊 图片信息</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">原始尺寸:</span>
                    <span className="font-medium">{image.width} × {image.height}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">文件大小:</span>
                    <span className="font-medium">{formatSize(image.fileSize)}</span>
                  </div>
                  {image.compressedSize && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">压缩后:</span>
                      <span className="font-medium text-green-600">{formatSize(image.compressedSize)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">宽高比:</span>
                    <span className="font-medium">
                      {(image.width / image.height).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">像素总数:</span>
                    <span className="font-medium">
                      {(image.width * image.height).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Batch Processing Panel */}
              {activeTool === 'batch' && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-700 mb-4">📦 批量处理</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-600 mb-2">上传图片</label>
                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files) {
                              handleBatchUpload(e.target.files)
                            }
                          }}
                          className="hidden"
                          id="batch-upload"
                        />
                        <label
                          htmlFor="batch-upload"
                          className="cursor-pointer block"
                        >
                          <div className="text-2xl mb-2">📁</div>
                          <p className="text-sm text-slate-600">点击或拖拽上传图片</p>
                          <p className="text-xs text-slate-400">最多 10 张，每张最大 20MB</p>
                        </label>
                      </div>
                    </div>
                    
                    {batchImages.length > 0 && (
                      <div>
                        <label className="block text-sm text-slate-600 mb-2">已选择图片 ({batchImages.length})</label>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {batchImages.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                              <span className="text-sm text-slate-600 truncate">{file.name}</span>
                              <span className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm text-slate-600 mb-2">应用当前滤镜设置</label>
                      <div className="text-xs text-slate-500 mb-2">
                        亮度: {brightness}%, 对比度: {contrast}%, 饱和度: {saturation}%, 
                        模糊: {blur}px, 黑白: {grayscale}%, 复古: {sepia}%
                      </div>
                    </div>
                    
                    {batchProcessing && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-slate-600">处理进度</span>
                          <span className="text-sm font-medium text-blue-600">{batchProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${batchProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    <button
                      onClick={processBatch}
                      disabled={batchImages.length === 0 || batchProcessing}
                      className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {batchProcessing ? '处理中...' : `开始处理 (${batchImages.length} 张图片)`}
                    </button>
                  </div>
                </div>
              )}

              {/* Enhancement Panel */}
              {activeTool === 'enhance' && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-700 mb-4">✨ 图片增强</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-600 mb-2">增强预设</label>
                      <div className="grid grid-cols-2 gap-2">
                        {enhancementPresets.map((preset, index) => (
                          <button
                            key={index}
                            onClick={() => applyEnhancementPreset(preset)}
                            className="py-2 px-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition text-sm"
                          >
                            {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-slate-600 mb-2">锐化: {sharpen}</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={sharpen}
                        onChange={(e) => setSharpen(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-slate-600 mb-2">降噪: {noiseReduction}</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={noiseReduction}
                        onChange={(e) => setNoiseReduction(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-slate-600 mb-2">暗角: {vignette}</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={vignette}
                        onChange={(e) => setVignette(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-slate-600 mb-2">曝光: {exposure}%</label>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={exposure}
                        onChange={(e) => setExposure(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={applyEnhancement}
                        className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                      >
                        应用增强
                      </button>
                      <button
                        onClick={resetEnhancement}
                        className="flex-1 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                      >
                        重置
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Watermark Panel */}
              {activeTool === 'watermark' && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-700 mb-4">🏷️ 添加水印</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-600 mb-2">水印文字</label>
                      <input
                        type="text"
                        value={watermarkText}
                        onChange={(e) => setWatermarkText(e.target.value)}
                        placeholder="输入水印文字"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-slate-600 mb-2">字体大小: {watermarkSize}px</label>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={watermarkSize}
                        onChange={(e) => setWatermarkSize(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-slate-600 mb-2">文字颜色</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={watermarkColor}
                          onChange={(e) => setWatermarkColor(e.target.value)}
                          className="w-12 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={watermarkColor}
                          onChange={(e) => setWatermarkColor(e.target.value)}
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-slate-600 mb-2">透明度: {Math.round(watermarkOpacity * 100)}%</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={watermarkOpacity}
                        onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-slate-600 mb-2">位置</label>
                      <div className="grid grid-cols-3 gap-2">
                        {watermarkPositions.map((pos) => (
                          <button
                            key={pos.value}
                            onClick={() => setWatermarkPosition(pos.value)}
                            className={`py-2 px-3 border rounded-lg transition text-sm ${
                              watermarkPosition === pos.value
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            {pos.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <button
                      onClick={applyWatermark}
                      disabled={!watermarkText}
                      className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      添加水印
                    </button>
                  </div>
                </div>
              )}

              {/* Tips */}
              <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                <h3 className="text-lg font-semibold text-blue-700 mb-2">💡 提示</h3>
                <ul className="text-sm text-blue-600 space-y-1">
                  <li>• 先移除背景，再替换纯色背景</li>
                  <li>• 基础背景移除使用颜色检测</li>
                  <li>• 所有处理在本地完成，隐私安全</li>
                  <li>• 大图片处理可能需要一些时间</li>
                  <li>• 建议先保存编辑后的图片</li>
                  <li>• 批量处理支持最多 10 张图片</li>
                  <li>• 图片增强可以提升图片质量</li>
                  <li>• 水印功能可以保护图片版权</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden Canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </main>
  )
}
