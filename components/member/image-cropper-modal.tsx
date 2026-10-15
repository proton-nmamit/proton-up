'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ZoomIn, ZoomOut, RotateCcw, Check, X, Move } from 'lucide-react'

interface ImageCropperModalProps {
  imageSrc: string
  onCropComplete: (croppedBlob: Blob) => void
  onCancel: () => void
}

export function ImageCropperModal({
  imageSrc,
  onCropComplete,
  onCancel,
}: ImageCropperModalProps) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Handle mouse/touch drag for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true)
      setDragStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      })
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return
    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    })
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  // Handle Zoom change
  const handleZoomChange = (newZoom: number) => {
    const clamped = Math.max(1, Math.min(3, newZoom))
    setZoom(clamped)
  }

  // Render crop onto canvas
  const handleCrop = () => {
    const img = imgRef.current
    if (!img) return

    const canvas = document.createElement('canvas')
    const size = 512
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Viewport diameter in pixels
    const cropSize = 260
    // Natural image dimensions vs displayed
    const scale = (img.naturalWidth / img.width) * (1 / zoom)
    const sourceSize = cropSize * scale
    const sourceX = (img.naturalWidth / 2) - (sourceSize / 2) - (pan.x * (img.naturalWidth / img.width) / zoom)
    const sourceY = (img.naturalHeight / 2) - (sourceSize / 2) - (pan.y * (img.naturalHeight / img.height) / zoom)

    ctx.drawImage(
      img,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      size,
      size
    )

    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCropComplete(blob)
        }
      },
      'image/jpeg',
      0.92
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0a0a0a] border border-[#222] rounded-2xl overflow-hidden shadow-2xl shadow-black flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1c1c1c] flex items-center justify-between">
          <div>
            <div className="text-xs font-mono font-bold uppercase text-[#00d05a] tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00d05a] animate-pulse" />
              <span>CALIBRATE AVATAR // CROP & ZOOM</span>
            </div>
            <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
              Drag to reposition • Use slider to zoom
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[#1a1a1a] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Crop Viewport Area */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative w-full h-80 bg-[#050505] flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing select-none"
        >
          {/* Draggable & Scalable Image */}
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Crop target"
            draggable={false}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              maxWidth: 'none',
              maxHeight: 'none',
              width: '280px',
              height: 'auto',
            }}
            className="pointer-events-none select-none"
          />

          {/* Mask Overlay: darkened area outside the crop circle */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="relative w-64 h-64 rounded-full border-2 border-[#00d05a] shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] flex items-center justify-center">
              {/* Subtle crosshairs */}
              <div className="absolute inset-x-0 h-px bg-[#00d05a]/20" />
              <div className="absolute inset-y-0 w-px bg-[#00d05a]/20" />
            </div>
          </div>

          {/* Guide hint */}
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/70 border border-[#222] text-[10px] font-mono text-muted-foreground pointer-events-none flex items-center gap-1">
            <Move className="w-3 h-3 text-[#00d05a]" />
            <span>DRAG TO POSITION</span>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="p-4 bg-[#0d0d0d] border-t border-[#1c1c1c] space-y-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleZoomChange(zoom - 0.2)}
              className="p-1.5 rounded-lg bg-[#141414] hover:bg-[#1f1f1f] text-muted-foreground hover:text-foreground border border-[#252525] transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
              className="flex-1 accent-[#00d05a] bg-[#1a1a1a] h-1.5 rounded-lg cursor-pointer"
            />

            <button
              type="button"
              onClick={() => handleZoomChange(zoom + 0.2)}
              className="p-1.5 rounded-lg bg-[#141414] hover:bg-[#1f1f1f] text-muted-foreground hover:text-foreground border border-[#252525] transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setZoom(1)
                setPan({ x: 0, y: 0 })
              }}
              className="p-1.5 rounded-lg bg-[#141414] hover:bg-[#1f1f1f] text-muted-foreground hover:text-foreground border border-[#252525] transition-colors text-xs font-mono"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl bg-[#141414] hover:bg-[#1c1c1c] text-muted-foreground hover:text-foreground border border-[#252525] text-xs font-mono uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleCrop}
              className="px-4 py-2 rounded-xl bg-[#00d05a] hover:bg-[#00e865] text-black font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-[0_0_15px_#00d05a]/20"
            >
              <Check className="w-4 h-4" />
              <span>Apply & Upload</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
