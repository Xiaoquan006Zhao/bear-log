import { getFileContent } from "@/lib/file-utils"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { filename: string } }) {
  try {
    const filename = decodeURIComponent(params.filename)
    const result = await getFileContent(filename)
    return NextResponse.json(result)
  } catch (error) {
    console.error(`Error getting file content for ${params.filename}:`, error)
    return NextResponse.json({ error: `Failed to get file content for ${params.filename}` }, { status: 500 })
  }
}

