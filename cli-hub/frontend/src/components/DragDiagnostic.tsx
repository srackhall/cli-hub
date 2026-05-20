import { useEffect, useRef, useState } from "react"

type DiagEntry = { ts: number; msg: string }

export function DragDiagnostic() {
  const [visible, setVisible] = useState(true)
  const [entries, setEntries] = useState<DiagEntry[]>([])
  const [wailsState, setWailsState] = useState<string>("checking...")
  const countRef = useRef(0)

  const log = (msg: string) => {
    console.log("[DD] " + msg)
    setEntries((prev) => {
      const next = [{ ts: Date.now(), msg }, ...prev].slice(0, 50)
      return next
    })
  }

  useEffect(() => {
    // Check _wails state
    const check = () => {
      const w = (window as any)._wails
      if (!w) {
        setWailsState("_wails is UNDEFINED")
        return
      }
      const parts: string[] = []
      parts.push("flags=" + JSON.stringify(w.flags))
      parts.push("handlePlatformFileDrop=" + typeof w.handlePlatformFileDrop)
      parts.push(
        "chrome.webview.postMessageWithAdditionalObjects=" +
          !!(
            (window as any).chrome?.webview
              ?.postMessageWithAdditionalObjects
          )
      )
      setWailsState(parts.join(" | "))
    }
    check()
    const timer = setInterval(check, 1000)

    // Global drag listeners
    const onDragEnter = (e: DragEvent) => {
      const hasFiles = e.dataTransfer?.types?.includes("Files")
      log(
        `dragenter files=${hasFiles} x=${e.clientX} y=${e.clientY} target=${(e.target as any)?.tagName}:${(e.target as any)?.className}`
      )
    }
    const onDragOver = (e: DragEvent) => {
      const hasFiles = e.dataTransfer?.types?.includes("Files")
      countRef.current++
      if (countRef.current % 10 === 0) {
        log(`dragover #${countRef.current} files=${hasFiles}`)
      }
    }
    const onDragLeave = (e: DragEvent) => {
      log(`dragleave target=${(e.target as any)?.tagName}`)
    }
    const onDrop = (e: DragEvent) => {
      const hasFiles = e.dataTransfer?.types?.includes("Files")
      const fileCount = e.dataTransfer?.files?.length ?? 0
      const items: string[] = []
      if (e.dataTransfer?.items) {
        for (let i = 0; i < e.dataTransfer.items.length; i++) {
          items.push(
            `${e.dataTransfer.items[i].kind}:${e.dataTransfer.items[i].type}`
          )
        }
      }
      log(
        `DROP files=${hasFiles} fileCount=${fileCount} items=[${items.join(", ")}]`
      )
    }

    document.addEventListener("dragenter", onDragEnter, true)
    document.addEventListener("dragover", onDragOver, true)
    document.addEventListener("dragleave", onDragLeave, true)
    document.addEventListener("drop", onDrop, true)

    // Listen for wails:filesdropped
    const onFilesDropped = (e: Event) => {
      const detail = (e as CustomEvent).detail as any
      log(`wails:filesdropped received! files=${JSON.stringify(detail?.files)}`)
    }
    document.addEventListener("wails:filesdropped", onFilesDropped)

    return () => {
      document.removeEventListener("dragenter", onDragEnter, true)
      document.removeEventListener("dragover", onDragOver, true)
      document.removeEventListener("dragleave", onDragLeave, true)
      document.removeEventListener("drop", onDrop, true)
      document.removeEventListener("wails:filesdropped", onFilesDropped)
      clearInterval(timer)
    }
  }, [])

  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="fixed bottom-1 right-1 z-[9999] bg-red-600 text-white text-[10px] px-2 py-0.5 rounded opacity-50 hover:opacity-100"
      >
        DD
      </button>
    )
  }

  return (
    <div className="fixed bottom-0 right-0 z-[9999] w-[420px] max-h-[300px] bg-black/90 text-green-400 text-[10px] font-mono border border-white/20 rounded-tl-md overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-2 py-1 bg-white/10 shrink-0">
        <span className="font-bold">Drag Diagnostic</span>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-white/60">{entries.length} events</span>
          <button
            onClick={() => setEntries([])}
            className="text-white/60 hover:text-white text-[9px]"
          >
            clear
          </button>
          <button
            onClick={() => setVisible(false)}
            className="text-white/60 hover:text-white"
          >
            ×
          </button>
        </div>
      </div>
      <div className="px-2 py-1 text-yellow-300 text-[9px] border-b border-white/10 shrink-0">
        _wails: {wailsState}
      </div>
      <div className="px-2 py-0.5 text-white/50 text-[9px] border-b border-white/10 shrink-0">
        HTML5 drop handlers: dragover/drop preventDefault on document (App.tsx)
        useEffect)
      </div>
      <div className="flex-1 overflow-y-auto p-1">
        {entries.length === 0 ? (
          <div className="text-white/40 px-2 py-4 text-center">
            Waiting for drag events...
            <br />
            Drag a file from Explorer onto this window
          </div>
        ) : (
          entries.map((e, i) => (
            <div key={i} className="px-1 leading-relaxed border-b border-white/5">
              <span className="text-white/40">
                {new Date(e.ts).toLocaleTimeString()}
              </span>{" "}
              {e.msg}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
