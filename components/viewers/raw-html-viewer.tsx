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

      // Set iframe height to content height exactly
      setIframeHeight(`${height}px`)
    } catch (error) {
      console.error("Error updating iframe height:", error)
    }
  }, [])

  // Custom smooth scroll function with adjustable duration
  const smoothScrollTo = useCallback((element: HTMLElement, to: number, duration: number) => {
    const start = element.scrollTop
    const change = to - start
    const startTime = performance.now()

    const animateScroll = (currentTime: number) => {
      const elapsedTime = currentTime - startTime

      if (elapsedTime > duration) {
        element.scrollTop = to
        return
      }

      // Easing function: easeInOutQuad
      let time = elapsedTime / duration
      time = time < 0.5 ? 2 * time * time : -1 + (4 - 2 * time) * time

      element.scrollTop = start + change * time
      requestAnimationFrame(animateScroll)
    }

    requestAnimationFrame(animateScroll)
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

      // If element found, check if it's in a folded section and unfold it
      if (targetElement && containerRef.current) {
        // Find all ancestor section wrappers that might be folded
        const doc = iframeRef.current.contentDocument

        // Function to check if a section is folded
        const isSectionFolded = (section) => {
          const contentContainer = section.querySelector(".foldable-content")
          return (
            contentContainer &&
            (contentContainer.style.display === "none" ||
              contentContainer.style.height === "0px" ||
              contentContainer.style.opacity === "0")
          )
        }

        // Find all ancestor section wrappers
        let currentElement = targetElement
        const foldedAncestors = []

        // Traverse up the DOM to find all folded ancestor sections
        while (currentElement) {
          const sectionWrapper = currentElement.closest(".section-wrapper")
          if (!sectionWrapper) break

          // Check if this section is folded
          if (isSectionFolded(sectionWrapper)) {
            foldedAncestors.push(sectionWrapper)
          }

          // Move up to the parent of the current section wrapper
          currentElement = sectionWrapper.parentElement
        }

        // Unfold all folded ancestors, starting from the outermost one
        if (foldedAncestors.length > 0) {
          // Reverse the array to start from the outermost section
          foldedAncestors.reverse().forEach((section) => {
            const toggleButton = section.querySelector(".fold-toggle") as HTMLElement
            if (toggleButton) {
              toggleButton.click()
            }
          })
        }

        // Scroll to the element with a slight delay to allow for unfolding animations
        setTimeout(
          () => {
            if (targetElement && containerRef.current) {
              const iframeDoc = iframeRef.current.contentDocument
              const docElement = iframeDoc.documentElement
              const bodyElement = iframeDoc.body

              // Get the position of the element within the iframe document
              const elementOffsetTop =
                targetElement.getBoundingClientRect().top +
                (docElement.scrollTop || bodyElement.scrollTop) -
                (docElement.clientTop || 0)

              // Calculate the absolute position in the container
              const iframeOffsetTop = iframeRef.current.offsetTop
              const scrollPosition = elementOffsetTop + iframeOffsetTop

              // Use custom smooth scroll with a faster duration 
              smoothScrollTo(containerRef.current, scrollPosition, 300)
            }
          },
          foldedAncestors.length > 0 ? 30 : 0,
        ) // Small delay if we had to unfold sections

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

  // Function to add content folding functionality
  const setupContentFolding = useCallback(() => {
    if (!iframeRef.current || !iframeRef.current.contentDocument) return

    const doc = iframeRef.current.contentDocument

    // Find the main content container
    const mainContent = doc.querySelector(".document-wrapper") || doc.body

    // Get all headings within the main content
    const headings = mainContent.querySelectorAll("h1, h2, h3, h4, h5, h6")

    // Keep track of processed headings to avoid duplicates
    const processedHeadings = new Set()

    // Add folding functionality to each heading
    headings.forEach((heading) => {
      // Skip if we've already processed this heading text
      const headingText = heading.textContent?.trim()
      if (!headingText || processedHeadings.has(headingText)) return
      processedHeadings.add(headingText)

      // Create a wrapper for the heading and its content
      const sectionWrapper = doc.createElement("div")
      sectionWrapper.className = "section-wrapper"
      sectionWrapper.style.width = "100%"

      // Create the heading wrapper
      const headingWrapper = doc.createElement("div")
      headingWrapper.className = "heading-wrapper"
      headingWrapper.style.position = "relative"
      headingWrapper.style.display = "flex"
      headingWrapper.style.alignItems = "center"
      headingWrapper.style.width = "100%"
      // Remove cursor pointer from heading wrapper since only the chevron is clickable now
      headingWrapper.style.cursor = "default"

      // Create toggle button
      const toggleButton = doc.createElement("button")
      toggleButton.className = "fold-toggle"
      toggleButton.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" 
  stroke="none" class="triangle-icon" style="display: block; margin: 0 auto;">
  <polygon points="4,8 20,8 12,20" />
</svg>
`
      toggleButton.style.background = "none"
      toggleButton.style.border = "none"
      toggleButton.style.padding = "3px"
      toggleButton.style.marginRight = "4px"
      toggleButton.style.borderRadius = "6px"
      toggleButton.style.transition = "transform 0.3s ease, color 0.2s ease"
      toggleButton.style.flexShrink = "0"
      toggleButton.style.display = "flex"
      toggleButton.style.alignItems = "center"
      toggleButton.style.justifyContent = "center"
      toggleButton.style.width = "28px"
      toggleButton.style.height = "28px"
      toggleButton.style.color = "rgb(100, 116, 139)" // slate-500
      toggleButton.style.cursor = "pointer" // Add cursor pointer to toggle button

      // Add hover effect - change color instead of background
      toggleButton.addEventListener("mouseover", () => {
        toggleButton.style.color = "rgb(59, 130, 246)" // Change to blue-500 for more prominence
      })

      toggleButton.addEventListener("mouseout", () => {
        toggleButton.style.color = "rgb(100, 116, 139)" // slate-500
      })

      // Clone the heading for the wrapper
      const headingClone = heading.cloneNode(true)
      headingClone.style.margin = "0"
      headingClone.style.flex = "1"

      // Add elements to heading wrapper
      headingWrapper.appendChild(toggleButton)
      headingWrapper.appendChild(headingClone)

      // Create content container
      const contentContainer = doc.createElement("div")
      contentContainer.className = "foldable-content"
      contentContainer.style.transition = "all 0.3s ease"
      contentContainer.style.overflow = "hidden"
      contentContainer.style.width = "100%"
      contentContainer.style.display = "block"

      // Collect content until the next heading of same or higher level
      const level = Number.parseInt(heading.tagName[1])
      let currentElement = heading.nextElementSibling
      const contentElements = []

      while (currentElement) {
        const isHeading = currentElement.tagName?.[0] === "H"
        const currentLevel = isHeading ? Number.parseInt(currentElement.tagName[1]) : 999

        if (isHeading && currentLevel <= level) break

        const nextElement = currentElement.nextElementSibling
        contentElements.push(currentElement)
        currentElement = nextElement
      }

      // Move content to the container
      contentElements.forEach((element) => {
        contentContainer.appendChild(element)
      })

      // Add everything to the section wrapper
      sectionWrapper.appendChild(headingWrapper)
      sectionWrapper.appendChild(contentContainer)

      // Replace the original heading with our section wrapper
      heading.parentNode?.replaceChild(sectionWrapper, heading)

      // Set up toggle functionality
      let isFolded = false

      const updateFoldState = () => {
        if (isFolded) {
          // When folding, use display: none after transition
          contentContainer.style.height = "0px"
          contentContainer.style.opacity = "0"
          contentContainer.style.marginTop = "0"
          contentContainer.style.marginBottom = "0"
          contentContainer.style.paddingTop = "0"
          contentContainer.style.paddingBottom = "0"
          toggleButton.style.transform = "rotate(-90deg)" // Rotate triangle to point right

          // After transition completes, set display to none to fully hide content
          setTimeout(() => {
            if (isFolded) {
              contentContainer.style.display = "none"
              updateIframeHeight()
            }
          }, 300)
        } else {
          // When unfolding, first set display to block
          contentContainer.style.display = "block"

          // Force a reflow
          contentContainer.offsetHeight

          // Then animate other properties
          contentContainer.style.height = "auto"
          contentContainer.style.opacity = "1"
          contentContainer.style.marginTop = ""
          contentContainer.style.marginBottom = ""
          contentContainer.style.paddingTop = ""
          contentContainer.style.paddingBottom = ""
          toggleButton.style.transform = "rotate(0)" // Reset rotation
        }

        // Update iframe height after toggling
        setTimeout(updateIframeHeight, 350)
      }

      // Handle click only on the toggle button
      toggleButton.addEventListener("click", (e) => {
        e.stopPropagation() // Prevent event bubbling
        isFolded = !isFolded
        updateFoldState()
      })

      // Handle image loading
      const images = contentContainer.querySelectorAll("img")
      images.forEach((img) => {
        if (img.complete) {
          // For already loaded images
          updateIframeHeight()
        } else {
          // For images that will load
          img.addEventListener("load", updateIframeHeight)
          img.addEventListener("error", updateIframeHeight)
        }
      })
    })

    // Add styles
    const style = doc.createElement("style")
    style.textContent = `
    .section-wrapper {
      margin-bottom: 1em;
    }
    
    .heading-wrapper {
      user-select: none;
    }
    
    .foldable-content {
      width: 100%;
    }
    
    .foldable-content img {
      max-width: 100%;
      height: auto;
    }
  `
    doc.head.appendChild(style)

    // Update iframe height
    updateIframeHeight()
  }, [updateIframeHeight])

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
          // Add basic styles to the iframe content
          const style = document.createElement("style")
          style.textContent = `
            body, html {
              margin: 0;
              padding: 0;
              height: auto;
              overflow: hidden !important;
            }
            
            /* Ensure no extra space at the bottom */
            body > *:last-child {
              margin-bottom: 0;
              padding-bottom: 0;
            }
          `
          iframe.contentDocument.head.appendChild(style)

          // Set up content folding
          setupContentFolding()

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
  }, [htmlContent, baseUrl, updateIframeHeight, setupContentFolding])

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
          overflow: "hidden",
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

