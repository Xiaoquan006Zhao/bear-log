"use server"

import { getFolderStructure } from "./file-utils"

// Debug utility to verify folder counts
export async function verifyFolderCounts() {
  try {
    const structure = await getFolderStructure()

    // Function to verify a node's count matches its actual unique files
    const verifyNode = (node, path = "") => {
      const nodePath = path ? `${path}/${node.name}` : node.name

      // Get all unique files in this node and its children
      const uniqueFiles = new Set(node.files)

      // Recursively collect files from all children
      const collectUniqueFiles = (childNode) => {
        childNode.files.forEach((file) => uniqueFiles.add(file))

        for (const key in childNode.children) {
          collectUniqueFiles(childNode.children[key])
        }
      }

      // Process all children
      for (const key in node.children) {
        collectUniqueFiles(node.children[key])
      }

      // Check if the count matches
      const actualCount = uniqueFiles.size
      const reportedCount = node.totalUniqueFiles

      const result = {
        path: nodePath,
        reportedCount,
        actualCount,
        isCorrect: reportedCount === actualCount,
        difference: reportedCount - actualCount,
      }

      // Recursively verify all children
      const childResults = []
      for (const key in node.children) {
        childResults.push(verifyNode(node.children[key], nodePath))
      }

      return {
        ...result,
        children: childResults,
      }
    }

    // Start verification from root
    const results = []
    for (const key in structure.children) {
      results.push(verifyNode(structure.children[key]))
    }

    return {
      rootCount: structure.totalUniqueFiles,
      results,
    }
  } catch (error) {
    console.error("Error verifying folder counts:", error)
    return { error: error.message }
  }
}

