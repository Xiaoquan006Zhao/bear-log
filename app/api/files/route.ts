import { getFilesList, getPaginatedFilesList } from "@/lib/file-utils"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    if (searchParams.has("paginated")) {
      const result = await getPaginatedFilesList(page, limit)
      return NextResponse.json(result)
    } else {
      const files = await getFilesList()
      return NextResponse.json({ files })
    }
  } catch (error) {
    console.error("Error listing files:", error)
    return NextResponse.json({ error: "Failed to list files" }, { status: 500 })
  }
}

