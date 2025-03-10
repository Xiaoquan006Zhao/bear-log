"use client"

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react"
import { LoadingIndicator } from "@/components/ui/loading-indicator"

// Define a ref type for external access to the component's methods
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
    const resizeObserverRef = useRef<ResizeObserver | null>(null)
    const [loading, setLoading] = useState(true)
    const [height, setHeight] = useState("100%")

    // Track content changes to force scroll reset
    const contentHashRef = useRef<string>("")

    // Expose methods to parent components via ref
    useImperativeHandle(ref, () => ({
      scrollToHeading: (id: string) => {
        if (!iframeRef.current || !iframeRef.current.contentDocument) return false

        // Try to find the element by ID first
        let targetElement = iframeRef.current.contentDocument.getElementById(id)

        // If not found by ID, try to find by generated ID pattern
        if (!targetElement && id.startsWith("heading-")) {
          // Extract the index from the ID
          const index = Number.parseInt(id.replace("heading-", ""), 10)
          if (!isNaN(index)) {
            // Find all headings and get the one at the specified index
            const headings =
              iframeRef.current.contentDocument.querySelectorAll("h1, h2, h3, h4, h5, h6")
            if (index < headings.length) {
              targetElement = headings[index] as HTMLElement
            }
          }
        }

        // If element found, scroll to it
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: "smooth" })
          return true
        }

        return false
      },
      scrollToTop: () => {
        if (iframeRef.current && iframeRef.current.contentDocument) {
          // Scroll both the iframe document and the container to the top
          iframeRef.current.contentDocument.documentElement.scrollTop = 0
          iframeRef.current.contentDocument.body.scrollTop = 0
          if (containerRef.current) {
            containerRef.current.scrollTop = 0
          }
        }
      },
    }))

    // Generate a simple hash for content to detect changes
    const generateContentHash = (content: string): string => {
      let hash = 0
      if (content.length === 0) return hash.toString()
      for (let i = 0; i < Math.min(content.length, 1000); i++) {
        const char = content.charCodeAt(i)
        hash = (hash << 5) - hash + char
        hash = hash & hash // Convert to 32bit integer
      }
      return hash.toString()
    }

    useEffect(() => {
      if (!iframeRef.current || !htmlContent || !containerRef.current) return

      // Generate a hash for the new content
      const newContentHash = generateContentHash(htmlContent)
      const contentChanged = contentHashRef.current !== newContentHash
      contentHashRef.current = newContentHash

      const iframe = iframeRef.current
      const container = containerRef.current

      // Clean up previous observer if it exists
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
        resizeObserverRef.current = null
      }

      // Reset container scroll position when content changes
      if (contentChanged) {
        container.scrollTop = 0
      }

      // Handle iframe load event
      const handleLoad = () => {
        setLoading(false)

        try {
          if (iframe.contentWindow && iframe.contentDocument?.body) {
            const iframeBody = iframe.contentDocument.body
            const iframeHtml = iframe.contentDocument.documentElement

            // Set the iframe to a fixed height that fits in the container
            setHeight("100%")

            // Make sure the iframe body takes up at least the full height
            const style = document.createElement("style")
            style.textContent = `
              body, html {
                min-height: 100%;
                margin: 0;
                padding: 0;
              }
            `
            iframe.contentDocument.head.appendChild(style)

            // Reset iframe scroll position when content changes
            if (contentChanged) {
              iframeHtml.scrollTop = 0
              iframeBody.scrollTop = 0
            }

            // Set up wheel event handling for seamless scrolling
            const handleWheel = (e: WheelEvent) => {
              const scrollTop = iframeHtml.scrollTop || iframeBody.scrollTop
              const scrollHeight = Math.max(iframeBody.scrollHeight, iframeHtml.scrollHeight)
              const clientHeight = iframe.clientHeight

              // Check if we're at the top or bottom of the iframe content
              const atTop = scrollTop <= 0 && e.deltaY < 0
              const atBottom = scrollTop + clientHeight >= scrollHeight - 5 && e.deltaY > 0

              // If at the edge, let the parent container handle the scroll
              if (atTop || atBottom) {
                // Don't prevent default - let the parent scroll
              } else {
                // Otherwise, let the iframe handle the scroll but prevent parent scrolling
                e.stopPropagation()
              }
            }

            // Add the wheel event listener to the iframe document
            iframe.contentDocument.addEventListener("wheel", handleWheel, { passive: false })

            // Clean up function to remove the event listener
            return () => {
              if (iframe.contentDocument) {
                iframe.contentDocument.removeEventListener("wheel", handleWheel)
              }
            }
          }
        } catch (error) {
          console.error("Error setting up iframe scrolling:", error)
        }
      }

      iframe.addEventListener("load", handleLoad)

      // Write content to iframe
      const doc = iframe.contentWindow?.document
      if (doc) {
        doc.open()

        // Process HTML to handle relative paths if needed
        let processedHtml = htmlContent

        // If we have a baseUrl, add a base tag to handle relative paths
        if (baseUrl) {
          processedHtml = processedHtml.replace(
            /<head>/i,
            `<head><base href="${baseUrl}">`
          )
        }

        // Insert script to handle:
        // 1) Alternate directory fallback on error
        // 2) ResizeObserver error supression
        // 3) Logging image load attempts
        processedHtml = processedHtml.replace(
          /<\/head>/i,
          `<script>
            document.addEventListener('error', function(e) {
              const target = e.target;
              console.log('Image Failed to load:', e.target.src);
              if (target && (target.tagName === 'IMG' || target.tagName === 'AUDIO' || target.tagName === 'VIDEO' || target.tagName === 'SOURCE')) {
                const srcAttr = target.tagName === 'SOURCE' ? 'srcset' : 'src';
                const originalSrc = target.getAttribute(srcAttr);
                // If the src is already in altDirectory, we don't want to loop infinitely.
                if (originalSrc && !originalSrc.includes('${altAttachmentDirectory}')) {
                  const newSrc = originalSrc.startsWith('/')
                    ? '/' + '${altAttachmentDirectory}' + originalSrc
                    : '${altAttachmentDirectory}/' + originalSrc;
                  target.setAttribute(srcAttr, newSrc);
                }
              }
            }, true);

            // Suppress ResizeObserver error
            window.addEventListener('error', function(e) {
              if (e.message.includes('ResizeObserver loop')) {
                e.stopPropagation();
                e.preventDefault();
                console.warn('Ignored ResizeObserver:', e.message);
              }
            });

            // Log whenever an IMG finishes loading
            document.addEventListener('load', function(e) {
              if (e.target && e.target.tagName === 'IMG') {
                console.log('Image attempted to load:', e.target.src);
              }
            }, true);
          </script></head>`
        )

        doc.write(processedHtml)
        doc.close()
      }

      return () => {
        iframe.removeEventListener("load", handleLoad)
        // Clean up the observer on unmount
        if (resizeObserverRef.current) {
          resizeObserverRef.current.disconnect()
        }
      }
    }, [htmlContent, baseUrl, altAttachmentDirectory])

    return (
      <div ref={containerRef} className="w-full h-full relative overflow-auto">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <LoadingIndicator text="Loading content..." />
          </div>
        )}
        <iframe
          ref={iframeRef}
          className="w-full border-0"
          style={{ height, display: "block" }}
          title="HTML Content"
          sandbox="allow-same-origin allow-scripts"
        />
      </div>
    )
  }
)

RawHtmlViewer.displayName = "RawHtmlViewer"
