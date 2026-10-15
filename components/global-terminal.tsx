"use client"

import { useState, useEffect } from "react"
import { ProtonTerminalModal } from "@/components/proton-terminal-modal"

/**
 * Programmatically open the PROTON interactive terminal from anywhere in the application.
 */
export function openGlobalTerminal() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-proton-terminal"))
  }
}

/**
 * Programmatically close the PROTON interactive terminal.
 */
export function closeGlobalTerminal() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("close-proton-terminal"))
  }
}

/**
 * Programmatically toggle the PROTON interactive terminal.
 */
export function toggleGlobalTerminal() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("toggle-proton-terminal"))
  }
}

export function GlobalTerminal() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleOpen = () => setIsOpen(true)
    const handleClose = () => setIsOpen(false)
    const handleToggle = () => setIsOpen((prev) => !prev)

    window.addEventListener("open-proton-terminal", handleOpen)
    window.addEventListener("close-proton-terminal", handleClose)
    window.addEventListener("toggle-proton-terminal", handleToggle)

    // Global keyboard shortcut: Backtick ` (tilde key)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not trigger if user is typing in an active form element
      const target = e.target as HTMLElement | null
      if (target) {
        const tagName = target.tagName
        if (tagName === "INPUT" || tagName === "TEXTAREA" || target.isContentEditable) {
          return
        }
      }

      if (e.key === "`" || e.code === "Backquote") {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("open-proton-terminal", handleOpen)
      window.removeEventListener("close-proton-terminal", handleClose)
      window.removeEventListener("toggle-proton-terminal", handleToggle)
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  return (
    <ProtonTerminalModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
    />
  )
}
