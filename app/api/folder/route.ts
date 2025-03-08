import { getFilesForFolder, getFolderStructure } from "@/lib/file-utils"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const path = searchParams.get("path") || ""

    if (path) {
      const page = Number.parseInt(searchParams.get("page") || "1")
      const limit = Number.parseInt(searchParams.get("limit") || "20")
      const result = await getFilesForFolder(path, page, limit)
      return NextResponse.json(result)
    } else {
      const structure = await getFolderStructure()
      return NextResponse.json(structure)
    }
  } catch (error) {
    console.error("Error getting folder data:", error)
    return NextResponse.json({ error: "Failed to get folder data" }, { status: 500 })
  }
}

