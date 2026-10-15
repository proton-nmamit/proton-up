"use client"

import React, { useEffect, useRef } from "react"

const CHARS = [".", "·", ":", "•", "+"]

interface AsciiRippleProps {
  className?: string
  opacity?: string
  maskGradient?: string
}

export function AsciiRipple({
  className = "",
  opacity = "opacity-[0.06]",
  maskGradient = "[mask-image:linear-gradient(to_bottom,black_60%,transparent_100%)]",
}: AsciiRippleProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const mousePosRef = useRef({ x: -2000, y: -2000 })
  const targetMouseRef = useRef({ x: -2000, y: -2000 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      targetMouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    }

    const handleMouseLeave = () => {
      targetMouseRef.current = { x: -2000, y: -2000 }
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true })
    document.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    let animationFrameId: number
    let width = 0
    let height = 0

    const resize = () => {
      if (!canvas) return
      width = canvas.offsetWidth
      height = canvas.offsetHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.scale(dpr, dpr)
    }

    resize()
    window.addEventListener("resize", resize)

    const cellWidth = 18
    const cellHeight = 22

    const render = () => {
      if (!canvas || width === 0 || height === 0) {
        animationFrameId = requestAnimationFrame(render)
        return
      }

      // Smooth mouse position damping
      mousePosRef.current.x += (targetMouseRef.current.x - mousePosRef.current.x) * 0.25
      mousePosRef.current.y += (targetMouseRef.current.y - mousePosRef.current.y) * 0.25

      ctx.clearRect(0, 0, width, height)

      const cols = Math.ceil(width / cellWidth)
      const rows = Math.ceil(height / cellHeight)

      ctx.font = "10px monospace"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      const mouseX = mousePosRef.current.x
      const mouseY = mousePosRef.current.y
      const maxDist = 65
      const maxDistSq = maxDist * maxDist

      const isDark = document.documentElement.classList.contains("dark")
      const baseColor = isDark ? "rgba(255, 255, 255, 0.25)" : "rgba(0, 0, 0, 0.25)"

      // Soft ambient light beneath the cursor to make the background ~10% brighter on hover
      if (mouseX > 0 && mouseY > 0 && mouseX < width && mouseY < height) {
        const glowGrad = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 95)
        glowGrad.addColorStop(0, "rgba(0, 208, 90, 0.09)")
        glowGrad.addColorStop(0.5, "rgba(0, 208, 90, 0.035)")
        glowGrad.addColorStop(1, "rgba(0, 208, 90, 0)")
        ctx.fillStyle = glowGrad
        ctx.beginPath()
        ctx.arc(mouseX, mouseY, 95, 0, Math.PI * 2)
        ctx.fill()
      }

      for (let r = 0; r < rows; r++) {
        const cellY = r * cellHeight + cellHeight / 2
        const dy = cellY - mouseY
        const dySq = dy * dy

        if (dySq > maxDistSq && mouseY > 0) {
          // Fast path: draw default dots outside vertical range
          ctx.fillStyle = baseColor
          for (let c = 0; c < cols; c++) {
            const cellX = c * cellWidth + cellWidth / 2
            ctx.fillText(".", cellX, cellY)
          }
          continue
        }

        for (let c = 0; c < cols; c++) {
          const cellX = c * cellWidth + cellWidth / 2
          const dx = cellX - mouseX
          const distSq = dx * dx + dySq

          if (distSq < maxDistSq) {
            const dist = Math.sqrt(distSq)
            const intensity = 1 - dist / maxDist
            const ripple = Math.sin(intensity * Math.PI * 2) * 0.5 + 0.5
            const charIndex = Math.min(
              CHARS.length - 1,
              Math.floor((intensity * 0.5 + ripple * 0.5) * CHARS.length)
            )
            const char = CHARS[charIndex]

            if (intensity > 0.35) {
              const alpha = Math.min(0.55, 0.20 + intensity * 0.35).toFixed(2)
              ctx.fillStyle = `rgba(0, 208, 90, ${alpha})`
            } else {
              const alpha = Math.min(0.38, 0.16 + intensity * 0.22).toFixed(2)
              ctx.fillStyle = isDark ? `rgba(255, 255, 255, ${alpha})` : `rgba(0, 0, 0, ${alpha})`
            }

            ctx.fillText(char, cellX, cellY)
          } else {
            ctx.fillStyle = baseColor
            ctx.fillText(".", cellX, cellY)
          }
        }
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener("resize", resize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none z-0 ${opacity} ${maskGradient} ${className}`}
    />
  )
}
