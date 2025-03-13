"use client"

import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from "react"
import { LoadingIndicator } from "@/components/ui/loading-indicator"

const primaryColor = "rgb(100, 116, 139)" // slate-500
const accentColor = "rgb(238, 39, 52)" // blue-500

export interface RawHtmlViewerRef {
  scrollToHeading: (id: string) => boolean
  scrollToTop: () => void
}

interface RawHtmlViewerProps {
  htmlContent: string
  baseUrl?: string
  altAttachmentDirectory?: string
}

export const RawHtmlViewer = forwardRef<RawHtmlViewerRef, RawHtmlViewerProps>(
  ({ htmlContent, baseUrl = "", altAttachmentDirectory = "" }, ref) => {
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [loading, setLoading] = useState(true)
    const [iframeHeight, setIframeHeight] = useState("100%")
    const contentHashRef = useRef<string>("")

    const updateIframeHeight = useCallback(() => {
      const iframe = iframeRef.current
      if (!iframe?.contentDocument) return

      requestAnimationFrame(() => {
        try {
          const doc = iframe.contentDocument
          const height = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight)
          setIframeHeight(`${height}px`)
        } catch (error) {
          console.error("Iframe height error:", error)
        }
      })
    }, [])

    const smoothScrollTo = useCallback((element: HTMLElement, to: number, duration: number) => {
      const start = element.scrollTop
      const change = to - start
      const startTime = performance.now()
      const animate = (time: number) => {
        const elapsed = time - startTime
        const progress = Math.min(elapsed / duration, 1)
        const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress
        element.scrollTop = start + change * ease
        if (progress < 1) requestAnimationFrame(animate)
      }
      requestAnimationFrame(animate)
    }, [])

    useImperativeHandle(ref, () => ({
      scrollToHeading: (id) => {
        const iframe = iframeRef.current
        if (!iframe?.contentDocument) return false

        let el = iframe.contentDocument.getElementById(id)
        if (!el && id.startsWith("heading-")) {
          const idx = Number.parseInt(id.replace("heading-", ""))
          const headings = iframe.contentDocument.querySelectorAll("h1, h2, h3, h4, h5, h6")
          el = idx < headings.length ? (headings[idx] as HTMLElement) : null
        }
        if (!el) return false

        const unfoldedSections = []
        let current = el
        while (current) {
          const section = current.closest(".section-wrapper")
          if (!section) break
          const content = section.querySelector(".foldable-content") as HTMLElement
          if (content?.style.display === "none") unfoldedSections.push(section)
          current = section.parentElement
        }

        unfoldedSections.reverse().forEach((sec) => {
          const btn = sec.querySelector(".fold-toggle") as HTMLElement
          btn?.click()
        })

        setTimeout(
          () => {
            const top = el.getBoundingClientRect().top + iframe.contentWindow!.scrollY
            smoothScrollTo(containerRef.current!, top + iframe.offsetTop, 300)
          },
          unfoldedSections.length ? 30 : 0,
        )
        return true
      },
      scrollToTop: () => containerRef.current && (containerRef.current.scrollTop = 0),
    }))

    const setupContentFolding = useCallback(() => {
      const iframe = iframeRef.current
      if (!iframe?.contentDocument) return
      const doc = iframe.contentDocument
      const main = doc.querySelector(".document-wrapper") || doc.body
      const headings = main.querySelectorAll("h1, h2, h3, h4, h5, h6")

      headings.forEach((h) => {
        const section = doc.createElement("div")
        section.className = "section-wrapper"

        const wrapper = doc.createElement("div")
        wrapper.className = "heading-wrapper"
        wrapper.style.cssText = "display:flex;align-items:center;cursor:default;width:100%"

        const btn = doc.createElement("button")
        btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" 
          stroke="none" class="triangle-icon" style="display: block; margin: 0 auto;">
          <polygon points="4,8 20,8 12,20" />
        </svg>
        `
        btn.className = "fold-toggle"
        Object.assign(btn.style, {
          background: "none",
          border: "none",
          marginRight: "4px",
          cursor: "pointer",
          color: primaryColor,
        })

        const clone = h.cloneNode(true) as HTMLElement
        clone.style.margin = "0"
        clone.style.flex = "1"

        wrapper.append(btn, clone)
        section.appendChild(wrapper)

        const content = doc.createElement("div")
        content.className = "foldable-content"
        content.style.cssText = "transition:all .3s ease;overflow:hidden;width:100%;display:block"

        let next = h.nextElementSibling
        const level = Number.parseInt(h.tagName[1])
        while (next && (!/^H[1-6]$/.test(next.tagName) || Number.parseInt(next.tagName[1]) > level)) {
          const temp = next.nextElementSibling
          content.appendChild(next)
          next = temp
        }

        section.appendChild(content)
        h.replaceWith(section)

        let folded = false
        btn.addEventListener("click", () => {
          folded = !folded
          content.style.display = folded ? "none" : "block"
          btn.style.transform = folded ? "rotate(-90deg)" : "rotate(0)"
          btn.style.color = folded ? accentColor : primaryColor
          updateIframeHeight()
        })
      })

      const style = doc.createElement("style")
      style.textContent = `
        .section-wrapper { margin-bottom: 1em; }
        .foldable-content img { max-width: 100%; height: auto; }
      `
      doc.head.appendChild(style)
      updateIframeHeight()
    }, [updateIframeHeight])

    const generateContentHash = (content: string) =>
      [...content].reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0).toString()

    useEffect(() => {
      const iframe = iframeRef.current
      if (!iframe || !htmlContent) return

      const hash = generateContentHash(htmlContent)
      if (contentHashRef.current !== hash) {
        contentHashRef.current = hash
        containerRef.current!.scrollTop = 0
        setIframeHeight("100%")
      }

      const doc = iframe.contentWindow?.document
      doc?.open()
      let processedHtml = htmlContent

      // Add base URL if provided
      if (baseUrl) {
        processedHtml = processedHtml.replace(/<head>/i, `<head><base href="${baseUrl}">`)
      }

      // Write the HTML to the iframe
      doc?.write(processedHtml)

      // Add the fallback script for media loading errors
      if (altAttachmentDirectory && doc) {
        const script = doc.createElement("script")
        script.textContent = `
      document.addEventListener('error', function(e) {
        const target = e.target;
        if (target && (target.tagName === 'IMG' || target.tagName === 'AUDIO' || target.tagName === 'VIDEO' || target.tagName === 'SOURCE')) {
          const srcAttr = target.tagName === 'SOURCE' ? 'srcset' : 'src';
          const originalSrc = target.getAttribute(srcAttr);
          if (originalSrc && !originalSrc.includes('${altAttachmentDirectory}')) {
            const newSrc = originalSrc.startsWith('/') ? '/${altAttachmentDirectory}' + originalSrc : '${altAttachmentDirectory}/' + originalSrc;
            console.log('Image Failed to load:', originalSrc, 'Trying:', newSrc);
            target.setAttribute(srcAttr, newSrc);
          }
        }
      }, true);
    `
        doc.head.appendChild(script)
      }

      doc?.close()

      const handleLoad = () => {
        setLoading(false)
        setupContentFolding()
        updateIframeHeight()
      }

      iframe.addEventListener("load", handleLoad)
      return () => iframe.removeEventListener("load", handleLoad)
    }, [htmlContent, baseUrl, setupContentFolding, updateIframeHeight, altAttachmentDirectory])

    return (
      <div ref={containerRef} className="w-full h-full relative overflow-auto scrollbar-custom">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <LoadingIndicator text="Loading content..." />
          </div>
        )}
        <iframe
          ref={iframeRef}
          style={{ height: iframeHeight }}
          className="w-full border-0"
          sandbox="allow-same-origin allow-scripts"
        />
      </div>
    )
  },
)

RawHtmlViewer.displayName = "RawHtmlViewer"

