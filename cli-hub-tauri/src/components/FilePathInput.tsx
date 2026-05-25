import { useCallback, useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FolderOpen } from "lucide-react"
import { open } from "@tauri-apps/plugin-dialog"
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow"

interface FilePathInputProps {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  isDirectory?: boolean
  className?: string
}

// Tracks which FilePathInput the cursor is over during a native drag.
// onDragDropEvent fires window-wide, so we use this to route the
// dropped file path to the correct input instance.
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

  // Native file-drop listener via the v2 onDragDropEvent API.
  // Required on Windows (WebView2) — the generic listen("tauri://drag-drop")
  // does not receive file paths there.
  useEffect(() => {
    let unlistenFn: (() => void) | null = null
    const appWindow = getCurrentWebviewWindow()
    appWindow.onDragDropEvent((event) => {
      if (event.payload.type === "drop" && event.payload.paths?.length) {
        if (wrapperRef.current === activeDropWrapper) {
          onChangeRef.current(event.payload.paths[0])
        }
        activeDropWrapper = null
      }
    }).then((fn) => { unlistenFn = fn })

    return () => { unlistenFn?.() }
  }, [])

  // Track which wrapper the cursor is over via native DOM events.
  // We avoid React synthetic events here because they can interfere
  // with WebView2's drag-drop event sequencing on Windows.
  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return

    const onDragOver = () => {
      activeDropWrapper = el
      setDragOver(true)
    }
    const onDragLeave = (e: DragEvent) => {
      // Only clear when actually leaving the wrapper, not when the
      // cursor moves into a child element (Input / Button).
      const related = e.relatedTarget as Node | null
      if (e.target === el && !(related && el.contains(related))) {
        activeDropWrapper = null
        setDragOver(false)
      }
    }

    el.addEventListener("dragover", onDragOver)
    el.addEventListener("dragleave", onDragLeave)
    return () => {
      el.removeEventListener("dragover", onDragOver)
      el.removeEventListener("dragleave", onDragLeave)
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
