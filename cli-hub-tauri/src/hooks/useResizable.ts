import { useState, useCallback, useRef } from "react"

interface UseResizableOptions {
  defaultSize: number
  minSize: number
  maxSize: number
  axis: "x" | "y"
}

export function useResizable({ defaultSize, minSize, maxSize, axis }: UseResizableOptions) {
  const [size, setSize] = useState(defaultSize)
  const [dragging, setDragging] = useState(false)
  const startRef = useRef({ startPos: 0, startSize: 0 })

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setDragging(true)
      startRef.current = {
        startPos: axis === "x" ? e.clientX : e.clientY,
        startSize: size,
      }

      const onMouseMove = (e: MouseEvent) => {
        const currentPos = axis === "x" ? e.clientX : e.clientY
        const delta = currentPos - startRef.current.startPos
        const newSize = Math.min(maxSize, Math.max(minSize, startRef.current.startSize + delta))
        setSize(newSize)
      }

      const onMouseUp = () => {
        setDragging(false)
        document.removeEventListener("mousemove", onMouseMove)
        document.removeEventListener("mouseup", onMouseUp)
      }

      document.addEventListener("mousemove", onMouseMove)
      document.addEventListener("mouseup", onMouseUp)
    },
    [axis, size, minSize, maxSize]
  )

  return { size, dragging, onMouseDown }
}
