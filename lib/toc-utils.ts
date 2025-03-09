export interface TocItem {
  id: string
  text: string
  level: number
  element?: HTMLElement // Make element optional since we won't store it
}

// Generate TOC from HTML string (used before iframe rendering)
export function generateTableOfContents(htmlContent: string): TocItem[] {
  // Create a temporary div to parse HTML
  const div = document.createElement("div")
  div.innerHTML = htmlContent

  // Find all heading elements
  const headings = div.querySelectorAll("h1, h2, h3, h4, h5, h6")

  // Convert headings to TOC items
  const toc: TocItem[] = Array.from(headings).map((heading, index) => {
    // Get heading level from tag name (h1 = 1, h2 = 2, etc)
    const level = Number.parseInt(heading.tagName[1])

    // Generate an ID if none exists
    const id = heading.id || `heading-${index}`
    heading.id = id

    return {
      id,
      text: heading.textContent || "",
      level,
      // Don't store the element reference since it's from a temporary div
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

