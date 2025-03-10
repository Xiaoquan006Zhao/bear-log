export interface TocItem {
  id: string
  text: string
  level: number
  element?: HTMLElement // Make element optional since we won't store it
}

// Generate TOC from HTML string (used before iframe rendering)
export function generateTableOfContents(htmlContent: string): TocItem[] {
  // Use the DOMParser API to parse the HTML without attaching it to the live DOM
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlContent, "text/html")

  // Now `doc` is a standalone Document, not in the live DOM—no requests will occur
  const headings = doc.querySelectorAll("h1, h2, h3, h4, h5, h6")

  // Process the headings as needed
  const toc: TocItem[] = Array.from(headings).map((heading, index) => {
    const level = Number.parseInt(heading.tagName[1])
    const id = `heading-${index}`

    heading.id = id

    return {
      id,
      text: heading.textContent || "",
      level
    }
  })
  return toc
}

// New function to scroll to heading inside an iframe
export function scrollToHeadingInIframe(id: string, iframeElement: HTMLIFrameElement | null) {
  if (!iframeElement || !iframeElement.contentDocument) return false

  // Try to find the element by ID first
  let targetElement = iframeElement.contentDocument.getElementById(id)

  // If not found by ID, try to find by generated ID pattern
  if (!targetElement && id.startsWith("heading-")) {
    // Extract the index from the ID
    const index = Number.parseInt(id.replace("heading-", ""), 10)
    if (!isNaN(index)) {
      // Find all headings and get the one at the specified index
      const headings = iframeElement.contentDocument.querySelectorAll("h1, h2, h3, h4, h5, h6")
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
}

