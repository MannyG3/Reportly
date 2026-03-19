"use client"
import { useEffect } from "react"

export default function GlobalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    const cursor = document.getElementById('global-mac-cursor')
    const cursorDot = document.getElementById('global-mac-cursor-dot')

    if (!cursor || !cursorDot) {
      return
    }

    let mx = 0, my = 0, cx = 0, cy = 0
    let rafId = 0

    const moveCursor = (e: MouseEvent) => { mx = e.clientX; my = e.clientY }

    const handlePointerOver = (e: Event) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      const isInteractive = target.closest('a, button, input, select, textarea, [role="button"], .mac-hover-target')
      if (isInteractive) {
        cursor.classList.add('hovered')
      }
    }

    const handlePointerOut = (e: Event) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      const isInteractive = target.closest('a, button, input, select, textarea, [role="button"], .mac-hover-target')
      if (isInteractive) {
        cursor.classList.remove('hovered')
      }
    }

    window.addEventListener('mousemove', moveCursor)
    document.addEventListener('mouseover', handlePointerOver)
    document.addEventListener('mouseout', handlePointerOut)

    const animCursor = () => {
      cx += (mx - cx) * 0.12
      cy += (my - cy) * 0.12
      cursor.style.transform = `translate(${cx - 20}px, ${cy - 20}px)`
      cursorDot.style.transform = `translate(${mx - 3}px, ${my - 3}px)`
      rafId = requestAnimationFrame(animCursor)
    }
    animCursor()

    return () => {
      window.removeEventListener('mousemove', moveCursor)
      document.removeEventListener('mouseover', handlePointerOver)
      document.removeEventListener('mouseout', handlePointerOut)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <>
      <div aria-hidden="true" id="global-mac-cursor"></div>
      <div aria-hidden="true" id="global-mac-cursor-dot"></div>
      <div className="mac-site-shell">{children}</div>
    </>
  )
}
