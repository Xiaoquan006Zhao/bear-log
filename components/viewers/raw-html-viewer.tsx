"use client"

import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from "react"
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
  const [loading, setLoading] = useState(true)
  const [iframeHeight, setIframeHeight] = useState("100%")

  // Track content changes to force scroll reset
  const contentHashRef = useRef<string>("")

  // Function to calculate and set iframe height
  const updateIframeHeight = useCallback(() => {
    if (!iframeRef.current || !iframeRef.current.contentDocument) return

    try {
      const doc = iframeRef.current.contentDocument
      const body = doc.body
      const html = doc.documentElement

      if (!body || !html) return

      // Get the scroll height of the content
      const height = Math.max(
        body.scrollHeight,
        body.offsetHeight,
        html.clientHeight,
        html.scrollHeight,
        html.offsetHeight,
      )

      // Set iframe height to content height exactly, without extra buffer
      setIframeHeight(`${height}px`)
    } catch (error) {
      console.error("Error updating iframe height:", error)
    }
  }, [])

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

      // If element found, scroll the container to the element's position
      if (targetElement && containerRef.current) {
        // Get element position relative to the iframe
        const rect = targetElement.getBoundingClientRect()
        const iframeRect = iframeRef.current.getBoundingClientRect()

        // Calculate the absolute position
        const absoluteTop = rect.top + iframeRef.current.offsetTop

        // Scroll the container
        containerRef.current.scrollTop = absoluteTop
        return true
      }

      return false
    },
    scrollToTop: () => {
      if (containerRef.current) {
        containerRef.current.scrollTop = 0
      }
    },
  }))

  // Function to apply dark mode to the iframe
  const applyDarkMode = useCallback((isDark: boolean) => {
    if (!iframeRef.current || !iframeRef.current.contentDocument) return

    const iframeDoc = iframeRef.current.contentDocument

    // Add or remove dark class on the html element
    if (isDark) {
      iframeDoc.documentElement.classList.add("dark")
    } else {
      iframeDoc.documentElement.classList.remove("dark")
    }
  }, [])

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
  }, [applyDarkMode])

  // Handle window resize events
  useEffect(() => {
    const handleResize = () => {
      updateIframeHeight()
    }

    window.addEventListener("resize", handleResize)

    // Set up a resize observer on the container
    const resizeObserver = new ResizeObserver(() => {
      updateIframeHeight()
    })

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      window.removeEventListener("resize", handleResize)
      resizeObserver.disconnect()
    }
  }, [updateIframeHeight])

  // Handle iframe content loading
  useEffect(() => {
    if (!iframeRef.current || !htmlContent || !containerRef.current) return

    // Generate a hash for the new content
    const newContentHash = generateContentHash(htmlContent)
    const contentChanged = contentHashRef.current !== newContentHash
    contentHashRef.current = newContentHash

    const iframe = iframeRef.current
    const container = containerRef.current

    // Reset container scroll position when content changes
    if (contentChanged) {
      container.scrollTop = 0
    }

    // Handle iframe load event
    const handleLoad = () => {
      setLoading(false)

      try {
        if (iframe.contentWindow && iframe.contentDocument?.body) {
          // Add styles to the iframe content
          const style = document.createElement("style")
          style.textContent = `
            body, html {
              margin: 0;
              padding: 0;
              height: auto;
              overflow: hidden !important; /* Change from visible to hidden */
            }
            
            /* Ensure no extra space at the bottom */
            body > *:last-child {
              margin-bottom: 0;
              padding-bottom: 0;
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

          // Update iframe height
          updateIframeHeight()

          // Set up mutation observer to detect content changes
          const mutationObserver = new MutationObserver(() => {
            updateIframeHeight()
          })

          mutationObserver.observe(iframe.contentDocument.body, {
            childList: true,
            subtree: true,
            attributes: true,
          })

          // Set up load event listeners for images
          const images = iframe.contentDocument.querySelectorAll("img")
          images.forEach((img) => {
            img.addEventListener("load", updateIframeHeight)
            img.addEventListener("error", updateIframeHeight)
          })

          return () => {
            mutationObserver.disconnect()
            images.forEach((img) => {
              img.removeEventListener("load", updateIframeHeight)
              img.removeEventListener("error", updateIframeHeight)
            })
          }
        }
      } catch (error) {
        console.error("Error setting up iframe:", error)
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
              if (e.message === 'ResizeObserver loop limit exceeded' || 
                  e.message.includes('ResizeObserver loop completed with undelivered notifications')) {
                e.stopPropagation();
                e.stopImmediatePropagation();
                e.preventDefault();
                console.warn('Ignored:', e.message);
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
    }
  }, [htmlContent, baseUrl, applyDarkMode, updateIframeHeight])

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-auto scrollbar-custom">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <LoadingIndicator text="Loading content..." />
        </div>
      )}

      <iframe
        ref={iframeRef}
        className="w-full border-0"
        style={{
          height: iframeHeight,
          display: "block",
          overflow: "hidden", // Ensure this is set to hidden
          border: "none",
          margin: 0,
          padding: 0,
        }}
        title="HTML Content"
        sandbox="allow-same-origin allow-scripts"
      />
    </div>
  )
})

RawHtmlViewer.displayName = "RawHtmlViewer"

