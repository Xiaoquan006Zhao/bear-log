import { verifyFolderCounts } from "@/lib/debug-utils"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const results = await verifyFolderCounts()
    return NextResponse.json(results)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export const revalidate = 60; // revalidate every 60 seconds