import { useCallback, useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FolderOpen } from "lucide-react"

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
      console.log('[DD] FilePathInput received wails:filesdropped event', e);
      const detail = (e as CustomEvent).detail as {
        files?: string[]
      } | undefined
      console.log('[DD] FilePathInput event detail:', detail);
      if (detail?.files && detail.files.length > 0) {
        console.log('[DD] FilePathInput setting value to:', detail.files[0]);
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
      console.error("File dialog failed:", err)
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

      const fileList = e.dataTransfer.files
      if (fileList && fileList.length > 0) {
        // On Windows, call WebView2 postMessageWithAdditionalObjects directly
        // to resolve full file paths. This bypasses the Wails runtime's
        // canResolveFilePaths() gate which requires _wails.flags.enableFileDrop === true.
        const wv = (window as any).chrome?.webview
        if (wv?.postMessageWithAdditionalObjects) {
          console.log(
            "[DD] FilePathInput calling postMessageWithAdditionalObjects directly, files:",
            fileList.length
          )
          const filesArr: File[] = []
          for (let i = 0; i < fileList.length; i++) {
            filesArr.push(fileList[i])
          }
          wv.postMessageWithAdditionalObjects(
            `file:drop:${e.clientX}:${e.clientY}`,
            filesArr
          )
          // Go backend will process and callback via
          // handlePlatformFileDrop → monkey-patch → wails:filesdropped
          return
        }

        // Fallback: try File.path (works in Electron, not WebView2)
        const path = (fileList[0] as any).path
        if (path && typeof path === "string") {
          console.log("[DD] FilePathInput got path from File.path:", path)
          onChange(path)
          return
        }
      }

      // Last resort: text/plain for file:// URLs
      const text = e.dataTransfer.getData("text/plain")
      if (text) {
        const cleaned = text.trim().replace(/^file:\/\//, "")
        onChange(cleaned)
      }
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
