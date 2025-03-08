import { getAttachmentFile } from "@/lib/attachment-utils"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { filename: string; path: string[] } }) {
  try {
    // Get the parameters directly from the params object
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

export const revalidate = 60; // revalidate every 60 seconds
