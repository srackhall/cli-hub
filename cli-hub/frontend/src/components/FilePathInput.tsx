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
      e.stopPropagation()
      setDragOver(false)

      const dt = e.dataTransfer
      const types = dt.types
      logger.info(`FilePathInput drop: types=${JSON.stringify(types)}, files=${dt.files.length}`)

      // Dump all available data for diagnosis
      for (const t of types) {
        try {
          const data = dt.getData(t)
          logger.info(`FilePathInput drop: getData("${t}") = ${JSON.stringify(data.slice(0, 500))}`)
        } catch (err) {
          logger.info(`FilePathInput drop: getData("${t}") threw: ${err}`)
        }
      }

      // Also dump the items/entries
      if (dt.items) {
        for (let i = 0; i < dt.items.length; i++) {
          const item = dt.items[i]
          logger.info(`FilePathInput drop: items[${i}] kind=${item.kind} type=${item.type}`)
        }
      }

      // For each file, dump everything we can
      for (let i = 0; i < dt.files.length; i++) {
        const f = dt.files[i] as any
        logger.info(`FilePathInput drop: files[${i}] name=${f.name} size=${f.size} type=${f.type} lastModified=${f.lastModified} path=${f.path} fullPath=${f.fullPath} webkitRelativePath=${f.webkitRelativePath}`)
      }

      // Try to resolve path from text/uri-list
      const uriList = dt.getData("text/uri-list")
      if (uriList) {
        const cleaned = decodeURIComponent(uriList.trim().split(/[\r\n]+/)[0].replace(/^file:\/\/\/?/i, ""))
        logger.info(`FilePathInput drop: resolved from text/uri-list: ${cleaned}`)
        onChange(cleaned)
        return
      }

      // Try text/plain (may contain file:// URL or path)
      const plain = dt.getData("text/plain")
      if (plain) {
        const cleaned = plain.trim().replace(/^file:\/\/\/?/i, "")
        logger.info(`FilePathInput drop: resolved from text/plain: ${cleaned}`)
        onChange(cleaned)
        return
      }

      logger.warn(`FilePathInput drop: no path could be resolved from DataTransfer`)
    },
    [onChange]
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
