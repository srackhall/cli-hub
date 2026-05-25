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

type InputRef = {
  el: HTMLDivElement
  setDragOver: (v: boolean) => void
  onChange: (v: string) => void
}

// Registry of all mounted FilePathInput wrappers for position-based hit testing.
// With dragDropEnabled: true, Tauri intercepts all native drag events — no DOM
// drag events fire. We use the (x,y) position from onDragDropEvent to find
// which wrapper element the cursor is over via document.elementFromPoint.
const registry = new Map<string, InputRef>()
let dragOverTargetId: string | null = null

function findTargetId(x: number, y: number): string | null {
  const el = document.elementFromPoint(x, y)
  if (!el) return null
  for (const [id, ref] of registry) {
    if (ref.el.contains(el)) return id
  }
  return null
}

let listenerInstalled = false
function ensureGlobalListener() {
  if (listenerInstalled) return
  listenerInstalled = true

  getCurrentWebviewWindow().onDragDropEvent((event) => {
    const { type, paths, position } = event.payload

    if (type === "over" && position) {
      if (dragOverTargetId) {
        registry.get(dragOverTargetId)?.setDragOver(false)
      }
      dragOverTargetId = findTargetId(position.x, position.y)
      if (dragOverTargetId) {
        registry.get(dragOverTargetId)?.setDragOver(true)
      }
    } else if (type === "drop" && position) {
      if (dragOverTargetId) {
        registry.get(dragOverTargetId)?.setDragOver(false)
      }
      const targetId = findTargetId(position.x, position.y)
      if (targetId && paths?.length) {
        registry.get(targetId)?.onChange(paths[0])
      }
      dragOverTargetId = null
    } else if (type === "leave") {
      if (dragOverTargetId) {
        registry.get(dragOverTargetId)?.setDragOver(false)
        dragOverTargetId = null
      }
    }
  })
}

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
  const instanceId = useRef(`fpi-${crypto.randomUUID()}`)

  useEffect(() => { ensureGlobalListener() }, [])

  useEffect(() => {
    const id = instanceId.current
    registry.set(id, {
      el: wrapperRef.current!,
      setDragOver,
      onChange,
    })
    return () => {
      registry.delete(id)
      if (dragOverTargetId === id) dragOverTargetId = null
    }
  }, [onChange])

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

  return (
    <div
      ref={wrapperRef}
      className={`relative flex gap-0 rounded-md border transition-colors duration-150 ${
        dragOver
          ? "border-accent bg-accent/10 ring-1 ring-accent/30"
          : "border-input"
      }`}
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
