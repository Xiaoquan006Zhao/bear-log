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
}

export const RawHtmlViewer = forwardRef<RawHtmlViewerRef, RawHtmlViewerProps>(({ htmlContent, baseUrl = "" }, ref) => {
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
          const headings = iframeRef.current.contentDocument.querySelectorAll("h1, h2, h3, h4, h5, h6")
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

  // Function to apply dark mode to the iframe
  const applyDarkMode = (isDark: boolean) => {
    if (!iframeRef.current || !iframeRef.current.contentDocument) return

    const iframeDoc = iframeRef.current.contentDocument

    // Add or remove dark class on the html element
    if (isDark) {
      iframeDoc.documentElement.classList.add("dark")
    } else {
      iframeDoc.documentElement.classList.remove("dark")
    }
  }

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

  // Effect to sync dark mode with iframe
  useEffect(() => {
    // Function to check and apply dark mode
    const syncDarkMode = () => {
      if (!iframeRef.current || !iframeRef.current.contentDocument) return

      // Check if parent document has dark mode
      const isDarkMode = document.documentElement.classList.contains("dark")
      applyDarkMode(isDarkMode)
    }

    // Set up a MutationObserver to watch for dark mode changes in the parent document
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class" &&
          mutation.target === document.documentElement
        ) {
          syncDarkMode()
        }
      })
    })

    // Start observing the document element for class changes
    observer.observe(document.documentElement, { attributes: true })

    // Initial sync
    syncDarkMode()

    return () => {
      observer.disconnect()
    }
  }, [])

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
        // Instead of adjusting iframe height, we'll make the iframe scrollable
        // and handle wheel events to create a seamless scrolling experience
        if (iframe.contentWindow && iframe.contentDocument?.body) {
          // Make sure the iframe content is scrollable
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
              
              /* Dark mode styles for iframe content */
              .dark {
                color-scheme: dark;
              }
              
              .dark body {
                background-color: hsl(222.2 84% 4.9%);
                color: hsl(210 40% 98%);
              }
              
              /* Style adjustments for specific elements in dark mode */
              .dark a {
                color: hsl(217.2 91.2% 59.8%);
              }
              
              .dark img {
                opacity: 0.8;
              }
              
              .dark pre, .dark code {
                background-color: hsl(217.2 32.6% 12%);
              }
              
              .dark table {
                border-color: hsl(217.2 32.6% 17.5%);
              }
              
              .dark th, .dark td {
                border-color: hsl(217.2 32.6% 17.5%);
              }
              
              .dark blockquote {
                border-color: hsl(217.2 32.6% 17.5%);
                color: hsl(215 20.2% 65.1%);
              }
            `
          iframe.contentDocument.head.appendChild(style)

          // Apply current dark mode state
          const isDarkMode = document.documentElement.classList.contains("dark")
          applyDarkMode(isDarkMode)

          // Reset iframe scroll position when content changes
          if (contentChanged) {
            iframeHtml.scrollTop = 0
            iframeBody.scrollTop = 0
          }

          // Set up wheel event handling for seamless scrolling
          const handleWheel = (e: WheelEvent) => {
            const iframeRect = iframe.getBoundingClientRect()
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
        processedHtml = processedHtml.replace(/<head>/i, `<head><base href="${baseUrl}">`)
      }

      // Add error handler for ResizeObserver loop limit error
      processedHtml = processedHtml.replace(
        /<\/head>/i,
        `<script>
            window.addEventListener('error', function(e) {
              if (e.message === 'ResizeObserver loop limit exceeded' || 
                  e.message.includes('ResizeObserver loop completed with undelivered notifications')) {
                e.stopPropagation();
                e.stopImmediatePropagation();
                e.preventDefault();
                console.warn('Ignored:', e.message);
              }
            });
          </script></head>`,
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
  }, [htmlContent, baseUrl])

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
        style={{
          height,
          display: "block",
        }}
        title="HTML Content"
        sandbox="allow-same-origin allow-scripts"
      />
    </div>
  )
})

RawHtmlViewer.displayName = "RawHtmlViewer"

