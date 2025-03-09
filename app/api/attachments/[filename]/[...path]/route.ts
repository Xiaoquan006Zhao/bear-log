import { getAttachmentFile } from "@/lib/attachment-utils"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, context: { params: { filename: string; path: string[] } }) {
  try {
    // First, await the entire params object
    const params = await context.params

    // Now we can safely access its properties
    const htmlFilename = decodeURIComponent(params.filename) + ".html"
    const attachmentPath = params.path.map((segment) => decodeURIComponent(segment)).join("/")

    // Get the attachment file
    const { buffer, contentType } = await getAttachmentFile(htmlFilename, attachmentPath)

    // Return the file with appropriate content type
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400", // Cache for 1 day
      },
    })
  } catch (error) {
    console.error("Error serving attachment:", error)
    return NextResponse.json({ error: "Failed to serve attachment" }, { status: 404 })
  }
}

