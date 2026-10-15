"use client"

import { useEffect, useRef, useState, type ElementType } from "react"

/**
 * Local equivalent of React Bits Pro's <TextScatter /> (paid registry,
 * @reactbits-starter/text-scatter-tw -- not installed here since it requires
 * a personal license/registry token this project doesn't have). Matches the
 * same public prop API documented at pro.reactbits.dev/docs/components/text-scatter
 * so it's a drop-in if the real package is ever licensed later.
 *
 * Renders `text` as a dot-matrix (sampled from the glyph shapes on an offscreen
 * canvas), then on hover scatters the dots outward and lets them drift back
 * into formation after `returnAfter` seconds.
 */
interface TextScatterProps {
  text: string
  className?: string
  as?: ElementType
  velocity?: number
  rotation?: number
  scale?: number
  returnAfter?: number
  duration?: number
  dotSize?: number
  dotGap?: number
  fontSize?: number
  fontFamily?: string
  color?: string
}

interface Dot {
  x: number
  y: number
  offsetX: number
  offsetY: number
  targetX: number
  targetY: number
  angle: number
  targetAngle: number
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export function TextScatter({
  text,
  className = "",
  as: Wrapper = "div",
  velocity = 200,
  rotation = 90,
  scale = 1,
  returnAfter = 1,
  duration = 2,
  dotSize = 3,
  dotGap = 5,
  fontSize = 96,
  fontFamily,
  color = "currentColor",
}: TextScatterProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dotsRef = useRef<Dot[]>([])
  const [size, setSize] = useState({ width: 0, height: 0 })

  // Sample the rendered glyph shapes into a dot grid.
  useEffect(() => {
    const sample = document.createElement("canvas")
    const ctx = sample.getContext("2d")
    if (!ctx) return

    const family =
      fontFamily ||
      getComputedStyle(document.documentElement).getPropertyValue("--font-geist-pixel-grid") ||
      "monospace"

    ctx.font = `${fontSize}px ${family || "monospace"}`
    const metrics = ctx.measureText(text)
    const width = Math.ceil(metrics.width) + dotGap * 2
    const height = Math.ceil(fontSize * 1.3)

    sample.width = width
    sample.height = height
    ctx.font = `${fontSize}px ${family || "monospace"}`
    ctx.fillStyle = "#fff"
    ctx.textBaseline = "alphabetic"
    ctx.fillText(text, dotGap, fontSize)

    const { data } = ctx.getImageData(0, 0, width, height)
    const dots: Dot[] = []
    for (let y = 0; y < height; y += dotGap) {
      for (let x = 0; x < width; x += dotGap) {
        const alpha = data[(y * width + x) * 4 + 3]
        if (alpha > 128) {
          dots.push({ x, y, offsetX: 0, offsetY: 0, targetX: 0, targetY: 0, angle: 0, targetAngle: 0 })
        }
      }
    }
    dotsRef.current = dots
    setSize({ width, height })
  }, [text, fontSize, fontFamily, dotGap])

  // Draw + animate loop.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || size.width === 0) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    canvas.width = size.width
    canvas.height = size.height

    // Canvas fillStyle can't resolve the CSS keyword "currentColor" itself --
    // resolve it to the container's actual computed text color up front.
    const resolvedColor =
      color === "currentColor" && containerRef.current
        ? getComputedStyle(containerRef.current).color
        : color

    let raf = 0
    let phase: "in" | "idle" | "out" | "wait" | "back" = "in"
    let phaseStart = performance.now()
    const inDuration = duration * 1000

    // Initial scatter-in: start each dot at a random offset.
    for (const d of dotsRef.current) {
      const angle = Math.random() * Math.PI * 2
      const dist = velocity * (0.3 + Math.random() * 0.7)
      d.offsetX = Math.cos(angle) * dist
      d.offsetY = Math.sin(angle) * dist
      d.angle = (Math.random() - 0.5) * rotation
      d.targetX = 0
      d.targetY = 0
      d.targetAngle = 0
    }

    const scatterOut = () => {
      for (const d of dotsRef.current) {
        const angle = Math.random() * Math.PI * 2
        const dist = velocity * (0.3 + Math.random() * 0.7)
        d.targetX = Math.cos(angle) * dist
        d.targetY = Math.sin(angle) * dist
        d.targetAngle = (Math.random() - 0.5) * rotation
      }
    }

    const settle = () => {
      for (const d of dotsRef.current) {
        d.targetX = 0
        d.targetY = 0
        d.targetAngle = 0
      }
    }

    const draw = (now: number) => {
      const elapsed = now - phaseStart

      if (phase === "in" && elapsed < inDuration) {
        const t = easeOutCubic(Math.min(1, elapsed / inDuration))
        ctx.clearRect(0, 0, size.width, size.height)
        ctx.fillStyle = resolvedColor
        for (const d of dotsRef.current) {
          const ox = d.offsetX * (1 - t)
          const oy = d.offsetY * (1 - t)
          const s = dotSize * scale * (0.4 + 0.6 * t)
          ctx.beginPath()
          ctx.arc(d.x + ox, d.y + oy, s / 2, 0, Math.PI * 2)
          ctx.fill()
        }
      } else if (phase === "in") {
        phase = "idle"
      } else if (phase === "idle" || phase === "wait") {
        ctx.clearRect(0, 0, size.width, size.height)
        ctx.fillStyle = resolvedColor
        for (const d of dotsRef.current) {
          ctx.beginPath()
          ctx.arc(d.x, d.y, (dotSize * scale) / 2, 0, Math.PI * 2)
          ctx.fill()
        }
        if (phase === "wait" && elapsed >= returnAfter * 1000) {
          settle()
          phase = "back"
          phaseStart = now
        }
      } else if (phase === "out" || phase === "back") {
        const t = easeInOutCubic(Math.min(1, elapsed / inDuration))
        ctx.clearRect(0, 0, size.width, size.height)
        ctx.fillStyle = resolvedColor
        for (const d of dotsRef.current) {
          const ox = d.offsetX + (d.targetX - d.offsetX) * t
          const oy = d.offsetY + (d.targetY - d.offsetY) * t
          ctx.beginPath()
          ctx.arc(d.x + ox, d.y + oy, (dotSize * scale) / 2, 0, Math.PI * 2)
          ctx.fill()
        }
        if (t >= 1) {
          for (const d of dotsRef.current) {
            d.offsetX = d.targetX
            d.offsetY = d.targetY
          }
          if (phase === "out") {
            phase = "wait"
            phaseStart = now
          } else {
            phase = "idle"
          }
        }
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    const el = containerRef.current
    const handleEnter = () => {
      if (phase === "idle") {
        scatterOut()
        phase = "out"
        phaseStart = performance.now()
      }
    }
    el?.addEventListener("mouseenter", handleEnter)

    return () => {
      cancelAnimationFrame(raf)
      el?.removeEventListener("mouseenter", handleEnter)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, velocity, rotation, scale, returnAfter, duration, dotSize, color])

  return (
    <Wrapper ref={containerRef as never} className={className} aria-label={text}>
      <canvas ref={canvasRef} style={{ display: "block", maxWidth: "100%" }} role="img" aria-hidden="true" />
    </Wrapper>
  )
}
