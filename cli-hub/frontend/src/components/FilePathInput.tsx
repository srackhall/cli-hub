import { useCallback, useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FolderOpen } from "lucide-react"
import { logger } from "@/logger"

interface FilePathInputProps {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  isDirectory?: boolean
  className?: string
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

  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return

    const onFilesDropped = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        files?: string[]
      } | undefined
      logger.debug(`FilePathInput wails:filesdropped files=${JSON.stringify(detail?.files)}`)
      if (detail?.files && detail.files.length > 0) {
        logger.info(`FilePathInput drop path resolved: ${detail.files[0]}`)
        onChangeRef.current(detail.files[0])
      }
    }

    el.addEventListener("wails:filesdropped", onFilesDropped)
    return () => el.removeEventListener("wails:filesdropped", onFilesDropped)
  }, [])

  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const observer = new MutationObserver(() => {
      setDragOver(el.classList.contains("file-drop-target-active"))
    })
    observer.observe(el, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  const handleBrowse = useCallback(async () => {
    setOpening(true)
    try {
      const endpoint = isDirectory
        ? "/api/dialogs/open-directory"
        : "/api/dialogs/open-file"
      const res = await fetch(`http://127.0.0.1:9246${endpoint}`, {
        method: "POST",
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `${res.status} ${res.statusText}`)
      }
      const data: { path: string } = await res.json()
      if (data.path) {
        onChange(data.path)
      }
    } catch (err) {
      logger.error(`File dialog failed: ${err}`)
    } finally {
      setOpening(false)
    }
  }, [isDirectory, onChange])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)

      // Cache the drop target so the monkey-patch has a fallback if
      // elementFromPoint fails due to coordinate mismatches (HiDPI, etc.)
      ;(window as any).__lastDropTarget = wrapperRef.current

      // Collect File objects from DataTransfer
      const files: File[] = []
      if (e.dataTransfer.items) {
        for (const item of e.dataTransfer.items) {
          if (item.kind === "file") {
            const file = item.getAsFile()
            if (file) files.push(file)
          }
        }
      } else if (e.dataTransfer.files) {
        for (const file of e.dataTransfer.files) {
          files.push(file)
        }
      }

      if (files.length > 0) {
        // Enumerate ALL properties on the File object to discover any
        // non-standard path property that WebView2 might expose directly.
        const fileProps: Record<string, unknown> = {}
        for (const key of Object.getOwnPropertyNames(files[0])) {
          try {
            fileProps[key] = (files[0] as any)[key]
          } catch (_) {}
        }
        // Also check prototype chain
        for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(files[0]))) {
          if (key === "constructor") continue
          try {
            fileProps[key] = (files[0] as any)[key]
          } catch (_) {}
        }
        logger.debug(
          `FilePathInput drop: files=${files.length} props=${JSON.stringify(fileProps)}`
        )

        // Try known non-standard path properties first
        const f = files[0] as any
        const directPath = f.path || f.fullPath || f.filePath || f.filesystemPath || f.nativePath || f.localPath || f.osPath
        if (directPath) {
          logger.info(`FilePathInput drop: direct path found: ${directPath}`)
          onChangeRef.current(directPath)
          return
        }

        // Fallback: try WebView2 postMessage pipeline
        const wv = (window as any).chrome?.webview
        if (wv?.postMessageWithAdditionalObjects) {
          logger.debug(
            `FilePathInput drop: direct postMessageWithAdditionalObjects files=${files.length}`
          )
          wv.postMessageWithAdditionalObjects(
            `file:drop:${e.clientX}:${e.clientY}`,
            files
          )
        } else {
          logger.debug(
            `FilePathInput drop: no path resolution available, types=${JSON.stringify(e.dataTransfer.types)}`
          )
        }
      }
    },
    []
  )

  return (
    <div
      ref={wrapperRef}
      data-file-drop-target="true"
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
        title={isDirectory ? "Browse directory..." : "Browse file..."}
      >
        <FolderOpen className={`h-3.5 w-3.5 ${opening ? "animate-pulse" : ""}`} />
      </Button>
    </div>
  )
}
