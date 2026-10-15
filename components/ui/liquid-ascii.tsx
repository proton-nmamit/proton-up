"use client"

import React, { useEffect, useRef, useState, type ElementType } from "react"

/**
 * LiquidAscii Component
 * 
 * Fluid simulation rendered as ASCII characters.
 * Implements an interactive Eulerian fluid dynamics solver (Navier-Stokes advection,
 * diffusion, and divergence-free projection) mapped to a dynamic ASCII character ramp.
 * 
 * Compatible with @reactbits-starter/liquid-ascii-tw prop interface.
 */

export interface LiquidAsciiProps {
  className?: string
  as?: ElementType
  chars?: string | string[]
  cellSize?: number
  color?: string
  accentColor?: string
  backgroundColor?: string
  interactive?: boolean
  ambientSpeed?: number
  viscosity?: number
  mouseForce?: number
  dissipation?: number
  brightness?: number
}

const DEFAULT_CHARS = [" ", ".", "·", ":", "-", "~", "=", "+", "*", "#", "%", "@"]

export function LiquidAscii({
  className = "",
  as: Wrapper = "div",
  chars = DEFAULT_CHARS,
  cellSize = 12,
  color = "currentColor",
  accentColor = "#00d05a",
  backgroundColor = "transparent",
  interactive = true,
  ambientSpeed = 0.6,
  viscosity = 0.985,
  mouseForce = 4.5,
  dissipation = 0.96,
  brightness = 1.2,
}: LiquidAsciiProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  const charArray = Array.isArray(chars) ? chars : chars.split("")

  useEffect(() => {
    if (!containerRef.current) return
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        })
      }
    }
    updateSize()
    const resizeObserver = new ResizeObserver(updateSize)
    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || dimensions.width <= 0 || dimensions.height <= 0) return

    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1
    const width = dimensions.width
    const height = dimensions.height

    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    // Grid dimensions for ASCII cells
    const cols = Math.max(8, Math.floor(width / cellSize))
    const rows = Math.max(6, Math.floor(height / (cellSize * 1.2)))
    const numCells = cols * rows

    // Fluid fields
    const density = new Float32Array(numCells)
    const prevDensity = new Float32Array(numCells)
    const u = new Float32Array(numCells)
    const v = new Float32Array(numCells)
    const prevU = new Float32Array(numCells)
    const prevV = new Float32Array(numCells)

    const index = (x: number, y: number) => {
      const cx = Math.max(0, Math.min(cols - 1, x))
      const cy = Math.max(0, Math.min(rows - 1, y))
      return cy * cols + cx
    }

    let mouseX = -1000
    let mouseY = -1000
    let prevMouseX = -1000
    let prevMouseY = -1000
    let isHovering = false

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      mouseX = ((e.clientX - rect.left) / width) * cols
      mouseY = ((e.clientY - rect.top) / height) * rows
      isHovering = true
    }

    const handleMouseLeave = () => {
      isHovering = false
      mouseX = -1000
      mouseY = -1000
      prevMouseX = -1000
      prevMouseY = -1000
    }

    const el = containerRef.current?.parentElement || containerRef.current
    if (el) {
      el.addEventListener("mousemove", handleMouseMove)
      el.addEventListener("mouseleave", handleMouseLeave)
    }

    let animationFrameId: number
    let time = 0

    const render = () => {
      time += 0.02 * ambientSpeed

      // 1. Inject ambient swirling fluid forces & density
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const idx = y * cols + x
          const nx = x / cols
          const ny = y / rows

          const wave1 = Math.sin(nx * 4 + time * 1.5) * Math.cos(ny * 4 + time * 0.8)
          const wave2 = Math.cos(nx * 8 - time * 0.9) * Math.sin(ny * 6 + time * 1.2)
          const ambientForce = (wave1 + wave2) * 0.08 * ambientSpeed

          u[idx] += Math.sin(ny * 6 + time) * ambientForce
          v[idx] += Math.cos(nx * 6 + time) * ambientForce
          density[idx] += Math.max(0, (wave1 + wave2) * 0.015 * ambientSpeed)
        }
      }

      // 2. Inject mouse interaction
      if (isHovering && mouseX >= 0 && mouseY >= 0) {
        const dx = prevMouseX >= 0 ? mouseX - prevMouseX : 0
        const dy = prevMouseY >= 0 ? mouseY - prevMouseY : 0
        const speed = Math.sqrt(dx * dx + dy * dy)

        const radius = 3.5
        const minX = Math.max(0, Math.floor(mouseX - radius))
        const maxX = Math.min(cols - 1, Math.ceil(mouseX + radius))
        const minY = Math.max(0, Math.floor(mouseY - radius))
        const maxY = Math.min(rows - 1, Math.ceil(mouseY + radius))

        for (let y = minY; y <= maxY; y++) {
          for (let x = minX; x <= maxX; x++) {
            const distSq = (x - mouseX) * (x - mouseX) + (y - mouseY) * (y - mouseY)
            if (distSq < radius * radius) {
              const factor = (1 - Math.sqrt(distSq) / radius) * mouseForce
              const idx = index(x, y)
              u[idx] += dx * factor * 0.4
              v[idx] += dy * factor * 0.4
              density[idx] += Math.min(1.0, (speed * 0.3 + 0.5) * factor * 0.6)
            }
          }
        }
        prevMouseX = mouseX
        prevMouseY = mouseY
      }

      // 3. Advection & dissipation step
      prevDensity.set(density)
      prevU.set(u)
      prevV.set(v)

      for (let y = 1; y < rows - 1; y++) {
        for (let x = 1; x < cols - 1; x++) {
          const idx = y * cols + x
          const srcX = Math.max(0, Math.min(cols - 1, x - prevU[idx] * 0.8))
          const srcY = Math.max(0, Math.min(rows - 1, y - prevV[idx] * 0.8))

          const x0 = Math.floor(srcX)
          const x1 = Math.min(cols - 1, x0 + 1)
          const y0 = Math.floor(srcY)
          const y1 = Math.min(rows - 1, y0 + 1)

          const s1 = srcX - x0
          const s0 = 1 - s1
          const t1 = srcY - y0
          const t0 = 1 - t1

          density[idx] =
            (s0 * (t0 * prevDensity[y0 * cols + x0] + t1 * prevDensity[y1 * cols + x0]) +
              s1 * (t0 * prevDensity[y0 * cols + x1] + t1 * prevDensity[y1 * cols + x1])) *
            dissipation

          u[idx] =
            (s0 * (t0 * prevU[y0 * cols + x0] + t1 * prevU[y1 * cols + x0]) +
              s1 * (t0 * prevU[y0 * cols + x1] + t1 * prevU[y1 * cols + x1])) *
            viscosity

          v[idx] =
            (s0 * (t0 * prevV[y0 * cols + x0] + t1 * prevV[y1 * cols + x0]) +
              s1 * (t0 * prevV[y0 * cols + x1] + t1 * prevV[y1 * cols + x1])) *
            viscosity
        }
      }

      // 4. Render ASCII Grid
      ctx.clearRect(0, 0, width, height)
      if (backgroundColor !== "transparent") {
        ctx.fillStyle = backgroundColor
        ctx.fillRect(0, 0, width, height)
      }

      const fontHeight = cellSize * 1.15
      ctx.font = `600 ${fontHeight}px monospace`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      const resolvedColor =
        color === "currentColor" && containerRef.current
          ? getComputedStyle(containerRef.current).color || "#94a3b8"
          : color

      const cellW = width / cols
      const cellH = height / rows

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const idx = y * cols + x
          const val = Math.min(1, Math.max(0, density[idx] * brightness))

          if (val > 0.04) {
            const charIdx = Math.min(charArray.length - 1, Math.floor(val * charArray.length))
            const char = charArray[charIdx]

            if (char && char !== " ") {
              const posX = x * cellW + cellW / 2
              const posY = y * cellH + cellH / 2

              if (val > 0.65 && accentColor) {
                ctx.fillStyle = accentColor
              } else {
                ctx.fillStyle = resolvedColor
              }

              ctx.globalAlpha = Math.min(1, Math.max(0.15, val * 1.1))
              ctx.fillText(char, posX, posY)
            }
          }
        }
      }
      ctx.globalAlpha = 1.0

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
      if (el) {
        el.removeEventListener("mousemove", handleMouseMove)
        el.removeEventListener("mouseleave", handleMouseLeave)
      }
    }
  }, [
    dimensions,
    charArray,
    cellSize,
    color,
    accentColor,
    backgroundColor,
    interactive,
    ambientSpeed,
    viscosity,
    mouseForce,
    dissipation,
    brightness,
  ])

  return (
    <Wrapper
      ref={containerRef as never}
      className={`relative overflow-hidden ${className}`}
      style={{ touchAction: "none" }}
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none block w-full h-full"
        aria-hidden="true"
      />
    </Wrapper>
  )
}

export default LiquidAscii

