export interface TocItem {
  id: string
  text: string
  level: number
  element: HTMLElement
}

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
      element: heading as HTMLElement,
    }
  })

  return toc
}

export function scrollToHeading(id: string) {
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({ behavior: "smooth" })
  }
}

