import { useCallback, useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FolderOpen } from "lucide-react"
import { open } from "@tauri-apps/plugin-dialog"
import { listen } from "@tauri-apps/api/event"

interface FilePathInputProps {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  isDirectory?: boolean
  className?: string
}

// Tracks which FilePathInput wrapper the user is currently dragging over.
// When the native tauri://drag-drop event fires, only the active instance
// updates its value — avoiding cross-instance contamination.
let activeDropWrapper: HTMLDivElement | null = null

export function FilePathInput({
  id,
  value,
  onChange,
  placeholder,
  isDirectory = false,
  className,
}: FilePathInputProps) {
  const [dragOver, setDragOver] = useState(false)
  const [opening, setOpening] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    const unlisten = listen<string[]>("tauri://drag-drop", (event) => {
      const paths = event.payload
      if (paths && paths.length > 0 && wrapperRef.current === activeDropWrapper) {
        onChangeRef.current(paths[0])
      }
      activeDropWrapper = null
    })
    return () => {
      unlisten.then((fn) => fn())
    }
  }, [])

  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return

    const onDragOver = () => {
      activeDropWrapper = el
      setDragOver(true)
    }
    const onDragLeave = () => {
      if (activeDropWrapper === el) activeDropWrapper = null
      setDragOver(false)
    }
    const onDrop = () => {
      if (activeDropWrapper === el) activeDropWrapper = null
      setDragOver(false)
    }

    el.addEventListener("dragover", onDragOver)
    el.addEventListener("dragleave", onDragLeave)
    el.addEventListener("drop", onDrop)
    return () => {
      el.removeEventListener("dragover", onDragOver)
      el.removeEventListener("dragleave", onDragLeave)
      el.removeEventListener("drop", onDrop)
    }
  }, [])

  const handleBrowse = useCallback(async () => {
    setOpening(true)
    try {
      const result = await open({
        directory: isDirectory,
        multiple: false,
        title: isDirectory ? "选择目录" : "选择文件",
      })
      if (result) {
        onChange(result as string)
      }
    } catch (err) {
      console.error("文件对话框失败:", err)
    } finally {
      setOpening(false)
    }
  }, [isDirectory, onChange])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
    inputRef.current?.focus()
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  return (
    <div
      ref={wrapperRef}
      className={`relative flex gap-0 rounded-md border transition-colors duration-150 ${
        dragOver
          ? "border-accent bg-accent/10 ring-1 ring-accent/30"
          : "border-input"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Input
        ref={inputRef}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`flex-1 border-0 rounded-r-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 ${className ?? "h-8 text-xs"}`}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 rounded-l-none border-l rounded-md rounded-l-none"
        onClick={handleBrowse}
        disabled={opening}
        title={isDirectory ? "浏览目录..." : "浏览文件..."}
      >
        <FolderOpen className={`h-3.5 w-3.5 ${opening ? "animate-pulse" : ""}`} />
      </Button>
    </div>
  )
}
