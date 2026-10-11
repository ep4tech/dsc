"use client"

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Save, RotateCcw, Code2, Pencil } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { getErrorMessage } from "@/lib/pb"
import { UI_STRINGS, t } from "@/lib/i18n"
import { useLang } from "@/lib/lang-context"

import "suneditor/css/editor"
import "suneditor/css/contents"
import "codemirror/lib/codemirror.css"

interface RichTextEditorProps {
  initialContent: string
  onSave: (html: string) => Promise<void>
  isSaving: boolean
  title?: string
  onDiscard?: () => void
  onImageUpload?: (file: File) => Promise<string>
  onChange?: (html: string) => void
  direction?: "ltr" | "rtl"
}

export function RichTextEditor({
  initialContent,
  onSave,
  isSaving,
  title,
  onImageUpload,
  onDiscard,
  onChange,
  direction = "ltr",
}: RichTextEditorProps) {
  const { lang } = useLang()
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<SunEditor.Instance | null>(null)
  const onImageUploadRef = useRef(onImageUpload)
  const onChangeRef = useRef(onChange)
  const lastSyncedInitialContent = useRef<string>("")
  const [content, setContent] = useState(initialContent)
  const [mode, setMode] = useState<"visual" | "html">("visual")
  const [editorReady, setEditorReady] = useState(false)

  // Keep callback refs up-to-date without re-creating the editor
  useEffect(() => {
    onImageUploadRef.current = onImageUpload
  }, [onImageUpload])
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  // Create editor once on mount
  useEffect(() => {
    let instance: SunEditor.Instance | undefined

    const init = async () => {
      if (!containerRef.current) return

      containerRef.current.innerHTML = ""
      const textarea = document.createElement("textarea")
      containerRef.current.appendChild(textarea)

      const [{ default: suneditor, plugins }, { default: CodeMirror }] =
        await Promise.all([import("suneditor"), import("codemirror")])

      if (!textarea.parentNode) return

      instance = suneditor.create(textarea, {
        plugins,
        externalLibs: {
          codeMirror: { src: CodeMirror },
        },
        textDirection: direction,
        toolbar_sticky: 93,
        value: initialContent,
        height: "600px",
        minHeight: "400px",
        buttonList: [
          ["undo", "redo"],
          "|",
          ["blockStyle", "font", "fontSize"],
          "|",
          ["bold", "italic", "underline", "strike", "subscript", "superscript"],
          "|",
          ["fontColor", "backgroundColor"],
          "|",
          ["textStyle"],
          "|",
          ["removeFormat"],
          "/",
          ["outdent", "indent", "align", "list"],
          "|",
          ["hr", "table", "link", "image", "video"],
          "|",
          ["fullScreen", "showBlocks"],
        ],
        events: {
          onChange: (params: { data: string }) => {
            setContent(params.data)
            lastSyncedInitialContent.current = params.data
            onChangeRef.current?.(params.data)
          },
          onImageUploadBefore: async (params) => {
            const { info } = params
            const uploadHandler = onImageUploadRef.current

            // URL upload (not a file) – let v3 handle it normally
            if (!(info.files instanceof FileList)) {
              return true
            }

            // No custom uploader – let v3 fall back to base64/default behaviour
            if (!uploadHandler || !info.files || info.files.length === 0) {
              return true
            }

            try {
              const url = await uploadHandler(info.files[0])
              const imagePlugin = instance!.$.plugins.image
              imagePlugin.create(
                url,
                null,
                "auto",
                "auto",
                "",
                { name: info.files[0].name, size: info.files[0].size },
                "",
                true
              )
              imagePlugin.modal.close()
              return false
            } catch (error) {
              console.error("Image upload failed:", error)
              toast.error(getErrorMessage(error))
              return false
            }
          },
        },
      })

      editorRef.current = instance
      setEditorReady(true)

      if (direction === "rtl") {
        containerRef.current
          ?.querySelector(".sun-editor-editable")
          ?.setAttribute("lang", "ar")
      }
    }

    init()

    return () => {
      // Fallback: destroy if useLayoutEffect hasn't already (e.g. effect re-run)
      if (instance && editorRef.current === instance) {
        try {
          instance.destroy()
        } catch {
          // DOM already detached; manual cleanup not critical here because
          // useLayoutEffect's cleanup will run after this with full fallback.
        }
        editorRef.current = null
      }
    }
  }, []) // run once

  // Update editor content when initialContent prop changes
  useEffect(() => {
    if (
      editorRef.current &&
      initialContent !== lastSyncedInitialContent.current
    ) {
      const current = editorRef.current.$.html.get()
      if (current === initialContent) {
        lastSyncedInitialContent.current = initialContent
        return
      }
      editorRef.current.$.html.set(initialContent)
      setContent(initialContent)
      lastSyncedInitialContent.current = initialContent
    }
  }, [initialContent])

  // Destroy editor BEFORE React removes the DOM.
  // useLayoutEffect cleanup runs synchronously before DOM mutations,
  // so the textarea and editor DOM are still attached when destroy() runs.
  useLayoutEffect(() => {
    return () => {
      const instance = editorRef.current
      if (!instance) return

      try {
        // Pre-emptively handle CodeMirror to prevent the toTextArea error.
        // If the wrapper is already detached, we skip CM cleanup (React will
        // remove it anyway) so destroy() can proceed past step 1.
        try {
          const hasCM = instance.$.options?.get?.("hasCodeMirror")
          if (hasCM && instance.$.contextProvider?.applyToRoots) {
            instance.$.contextProvider.applyToRoots((e) => {
              const cm = e.get("options").get("codeMirrorEditor")
              if (cm?.display?.wrapper?.isConnected) {
                cm.toTextArea()
              }
            })
          }
        } catch {
          console.warn(
            "Editor cleanup could not finish; continuing fallback cleanup"
          )
        }

        instance.destroy()
      } catch {
        // destroy() still hit an error.  Perform critical memory cleanup manually.
        if (instance.events) {
          for (const k in instance.events) instance.events[k] = null
          instance.events = null
        }
        try {
          ;(
            instance.$ as SunEditor.Deps & {
              kernel?: { _destroy?: () => void }
            }
          ).kernel?._destroy?.()
        } catch {
          console.warn("Editor kernel cleanup failed")
        }
      }

      editorRef.current = null
    }
  }, [])

  const handleSave = useCallback(() => {
    const currentContent =
      mode === "visual" && editorRef.current
        ? editorRef.current.$.html.get()
        : content
    onSave(currentContent)
  }, [content, mode, onSave])

  const switchMode = (next: "visual" | "html") => {
    if (next === mode || !editorRef.current) return
    if (next === "html") {
      const html = editorRef.current.$.html.get()
      setContent(html)
      lastSyncedInitialContent.current = html
      onChangeRef.current?.(html)
    } else {
      editorRef.current.$.html.set(content)
      const html = editorRef.current.$.html.get()
      setContent(html)
      lastSyncedInitialContent.current = html
      onChangeRef.current?.(html)
    }
    setMode(next)
  }

  return (
    <div className="flex flex-col gap-4">
      {title && (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{title}</h2>
          <div className="flex items-center gap-2">
            {onDiscard && (
              <Button variant="outline" onClick={onDiscard}>
                <RotateCcw className="mr-2 h-4 w-4" />
                {t(UI_STRINGS.discard_changes, lang)}
              </Button>
            )}
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isSaving ? t(UI_STRINGS.saving, lang) : t(UI_STRINGS.save, lang)}
            </Button>
          </div>
        </div>
      )}
      <div
        className="flex flex-wrap items-center gap-2"
        role="group"
        aria-label={t({ en: "Editor mode", ar: "وضع التحرير" }, lang)}
      >
        <Button
          type="button"
          variant={mode === "visual" ? "default" : "outline"}
          aria-pressed={mode === "visual"}
          disabled={!editorReady || isSaving}
          onClick={() => switchMode("visual")}
        >
          <Pencil className="h-4 w-4" />{" "}
          {t({ en: "Visual (WYSIWYG)", ar: "المحرر المرئي" }, lang)}
        </Button>
        <Button
          type="button"
          variant={mode === "html" ? "default" : "outline"}
          aria-pressed={mode === "html"}
          disabled={!editorReady || isSaving}
          onClick={() => switchMode("html")}
        >
          <Code2 className="h-4 w-4" /> HTML
        </Button>
      </div>
      <div
        ref={containerRef}
        className="rounded-md border"
        hidden={mode === "html"}
      />
      {mode === "html" && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {t(
              {
                en: "Copy, paste, or edit HTML here. Switch to Visual to view the formatted content.",
                ar: "انسخ أو الصق أو عدّل HTML هنا. انتقل إلى المحرر المرئي لعرض المحتوى المنسّق.",
              },
              lang
            )}
          </p>
          <Textarea
            aria-label={t({ en: "HTML source", ar: "مصدر HTML" }, lang)}
            dir="ltr"
            spellCheck={false}
            className="min-h-[400px] font-mono text-sm"
            value={content}
            onChange={(event) => {
              const html = event.target.value
              setContent(html)
              lastSyncedInitialContent.current = html
              onChangeRef.current?.(html)
            }}
          />
        </div>
      )}
      {!title && (
        <div className="flex justify-end gap-2">
          {onDiscard && (
            <Button variant="outline" onClick={onDiscard}>
              <RotateCcw className="mr-2 h-4 w-4" />
              {t(UI_STRINGS.discard_changes, lang)}
            </Button>
          )}
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isSaving ? t(UI_STRINGS.saving, lang) : t(UI_STRINGS.save, lang)}
          </Button>
        </div>
      )}
    </div>
  )
}
