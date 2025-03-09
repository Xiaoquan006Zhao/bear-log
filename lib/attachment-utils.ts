"use client"

// This function is a placeholder for a static site
// In a real application, this would read the file from the filesystem
// or a database.

export async function getAttachmentFile(
  htmlFilename: string,
  attachmentPath: string,
): Promise<{ buffer: ArrayBuffer; contentType: string }> {
  // Construct the full path to the attachment
  const fullPath = `/attachments/${encodeURIComponent(htmlFilename.replace(".html", ""))}/${attachmentPath}`

  try {
    // Fetch the attachment file
    const response = await fetch(fullPath)

    if (!response.ok) {
      throw new Error(`Failed to fetch attachment: ${response.statusText}`)
    }

    // Get the content type from the response headers
    const contentType = response.headers.get("Content-Type") || "application/octet-stream"

    // Get the file as an ArrayBuffer
    const buffer = await response.arrayBuffer()

    return { buffer, contentType }
  } catch (error) {
    console.error("Error getting attachment file:", error)
    throw new Error("Failed to get attachment file")
  }
}

