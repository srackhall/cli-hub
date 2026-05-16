import { useState, useCallback, useRef, useEffect } from "react"

interface UseResizableOptions {
  defaultSize: number
  minSize: number
  maxSize?: number
  axis: "x" | "y"
}

export function useResizable({ defaultSize, minSize, maxSize = Infinity, axis }: UseResizableOptions) {
  const [size, setSize] = useState(defaultSize)
  const [dragging, setDragging] = useState(false)
  const sizeRef = useRef(size)

  useEffect(() => {
    sizeRef.current = size
  }, [size])

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setDragging(true)
      const startPos = axis === "x" ? e.clientX : e.clientY
      const startSize = sizeRef.current

      const onMouseMove = (ev: MouseEvent) => {
        const currentPos = axis === "x" ? ev.clientX : ev.clientY
        const delta = currentPos - startPos
        setSize(Math.max(minSize, Math.min(maxSize, startSize + delta)))
      }

      const onMouseUp = () => {
        setDragging(false)
        document.removeEventListener("mousemove", onMouseMove)
        document.removeEventListener("mouseup", onMouseUp)
      }

      document.addEventListener("mousemove", onMouseMove)
      document.addEventListener("mouseup", onMouseUp)
    },
    [axis, minSize, maxSize]
  )

  return { size, dragging, onMouseDown }
}
