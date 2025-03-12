const fs = require("fs");
const fsPromises = fs.promises;
const path = require("path");
const { marked } = require("marked");
const lunr = require("lunr");  // Ensure lunr is installed via npm
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

// Directories
const BASE_DIR = process.cwd();
const CONTENTS_DIR = path.join(BASE_DIR, "contents");
const HTML_OUTPUT_DIR = path.join(BASE_DIR, "public", "data");
const FOLDERS_DIR = path.join(BASE_DIR, "public", "folders");
const ATTACHMENTS_DIR = path.join(BASE_DIR, "public", "data");
const ATTACHMENTS_URL = "data"; // URL prefix for attachments
const SCRIPTS_DIR = path.join(BASE_DIR, "scripts");

/* -----------------------------------------------
   Helper Functions
----------------------------------------------- */


function stripHtml(html) {
  const dom = new JSDOM(html);
  return dom.window.document.body.textContent || "";
}


// Process hashtags in HTML content and return processed HTML and generated tags.
function processHashtags(htmlContent) {
  const hashtagRegex = /<p>(#[^<\s]+(?:\/[^<\s]+)*)<\/p>/g;
  let generatedTags = "";
  const processedHtmlContent = htmlContent.replace(hashtagRegex, (match, hashtag) => {
    const segments = hashtag.split("/");
    let currentTag = "";
    let tags = "";
    for (const segment of segments) {
      currentTag += currentTag ? "/" + segment.replace(/^#/, "") : segment.replace(/^#/, "");
      tags = tags ? `${currentTag}, ${tags}` : currentTag;
    }
    generatedTags = tags;

    let formattedHashtag = `<span class='hashtag'><span class='hashtag-marker marker'>#</span>${segments[0].replace(/^#/, "")}`;
    for (let i = 1; i < segments.length; i++) {
      formattedHashtag += `<span class='hashtag-separator-marker marker'>/</span>${segments[i]}`;
    }
    formattedHashtag += '</span>';
    return `<p>${formattedHashtag}</p>`;
  });
  return { generatedTags, processedHtmlContent };
}

// Ensure a directory exists; create it if necessary.
async function ensureDir(dirPath) {
  try {
    await fsPromises.stat(dirPath);
  } catch (error) {
    if (error.code === "ENOENT") {
      await fsPromises.mkdir(dirPath, { recursive: true });
    } else {
      throw error;
    }
  }
}

// Delete a folder and all its contents.
async function deleteFolder(folderPath) {
  try {
    await fsPromises.rm(folderPath, { recursive: true, force: true });
    console.log(`Deleted folder: ${folderPath}`);
  } catch (error) {
    console.error(`Error deleting folder ${folderPath}:`, error);
  }
}

// Extract metadata from an HTML string.
function extractMetadata(html) {
  const metadata = {
    title: "",
    created: "",
    modified: "",
    tags: "",
    uniqueId: "",
    lastDevice: "",
  };

  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  if (titleMatch?.[1]) {
    metadata.title = titleMatch[1];
  }
  const metaRegex = /<meta\s+name=["']([^"']+)["']\s+content=["']([^"']+)["']/gi;
  let match;
  while ((match = metaRegex.exec(html)) !== null) {
    const key = match[1].toLowerCase();
    const content = match[2];
    switch (key) {
      case "created":
        metadata.created = content;
        break;
      case "modified":
        metadata.modified = content;
        break;
      case "tags":
        metadata.tags = content;
        break;
      case "bear-note-unique-identifier":
        metadata.uniqueId = content;
        break;
      case "last device":
        metadata.lastDevice = content;
        break;
      default:
        metadata[key] = content;
    }
  }
  return metadata;
}

// Check if an attachment folder exists for a given HTML file.
async function checkAttachmentFolder(htmlFilename) {
  try {
    const baseName = htmlFilename.replace(/\.html$/, "");
    const folderPath = path.join(CONTENTS_DIR, baseName);
    const stats = await fsPromises.stat(folderPath);
    return stats.isDirectory();
  } catch (error) {
    return false;
  }
}

// Extract local image references from HTML content.
function extractImageReferences(htmlContent) {
  const imageRefs = [];
  const regex = /<img\s+[^>]*?src=["'](?!https?:\/\/)([^"']+\.(png|jpg|jpeg|gif|svg|webp))["'][^>]*>/gi;
  let match;
  while ((match = regex.exec(htmlContent)) !== null) {
    if (match[1]) {
      const cleanPath = match[1].replace(/^\.\.?\//, "").trim();
      imageRefs.push(cleanPath);
    }
  }
  return imageRefs;
}

/* -----------------------------------------------
   Core Processing Functions
----------------------------------------------- */

// Convert a Markdown file to HTML, processing any frontmatter, and write the HTML file.
async function convertMarkdownToHtml(markdownPath, filename) {
  try {
    const markdown = await fsPromises.readFile(markdownPath, "utf8");
    const styleTemplate = await fsPromises.readFile(path.join(SCRIPTS_DIR, "style-template.html"), "utf8");

    let styleTag = "";
    const styleMatch = styleTemplate.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    if (styleMatch?.[1]) {
      styleTag = `<style>${styleMatch[1]}</style>`;
    }

    let metadata = {
      title: path.basename(filename, ".md"),
      created: "unavailable",
      modified: "unavailable",
      tags: "",
      uniqueId: `md-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
      lastDevice: "Markdown Import"
    };
    let content = markdown;

    const frontmatterMatch = markdown.match(/^---\n([\s\S]*?)\n---\n/);
    if (frontmatterMatch) {
      content = markdown.substring(frontmatterMatch[0].length);
      frontmatterMatch[1].split("\n").forEach(line => {
        const [key, value] = line.split(":").map(part => part.trim());
        if (key && value) {
          metadata[key.toLowerCase()] = value;
        }
      });
    }

    const htmlContent = marked.parse(content);
    const { generatedTags, processedHtmlContent } = processHashtags(htmlContent);
    metadata.tags = generatedTags;

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <title>${metadata.title}</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="bear-note-unique-identifier" content="${metadata.uniqueId}">
  <meta name="created" content="${metadata.created}">
  <meta name="modified" content="${metadata.modified}">
  <meta name="tags" content="${metadata.tags}">
  <meta name="last device" content="${metadata.lastDevice}">
  ${styleTag}
</head>
<body>
  <div class="document-wrapper">
    ${processedHtmlContent}
    <br><br><br>
  </div>
</body>
</html>`;

    const htmlFileName = path.basename(filename, ".md") + ".html";
    const htmlFilePath = path.join(CONTENTS_DIR, htmlFileName);
    await fsPromises.writeFile(htmlFilePath, fullHtml);
    console.log(`Written HTML file: ${htmlFilePath}`);
  } catch (error) {
    console.error(`Error converting markdown file ${markdownPath}:`, error);
    return null;
  }
}

// Process attachments: copy files from the source attachment folder to the public data folder,
// and return up to 4 image attachment URLs.
async function processAttachments(htmlFilename, htmlContent) {
  const baseName = htmlFilename.replace(/\.html$/, "");
  const sourceFolderPath = path.join(CONTENTS_DIR, baseName);
  const destFolderPath = path.join(ATTACHMENTS_DIR, baseName);

  const folderExists = await checkAttachmentFolder(htmlFilename);
  if (!folderExists) return { imageAttachments: [] };

  await ensureDir(destFolderPath);
  const files = await fsPromises.readdir(sourceFolderPath);
  for (const file of files) {
    const sourceFilePath = path.join(sourceFolderPath, file);
    const destFilePath = path.join(destFolderPath, file);
    try {
      const fileStat = await fsPromises.stat(sourceFilePath);
      if (fileStat.isFile()) {
        const fileContent = await fsPromises.readFile(sourceFilePath);
        await fsPromises.writeFile(destFilePath, fileContent);
      }
    } catch (error) {
      console.error(`Error copying file ${file}:`, error);
    }
  }
  const imageRefs = extractImageReferences(htmlContent);
  const imageAttachments = imageRefs
    .slice(0, 4)
    .map(file => `${ATTACHMENTS_URL}/${baseName}/${path.basename(file)}`);
  return { imageAttachments };
}

// Generate a nested folder structure based on file metadata tags.
async function generateFolderStructure(files, metadataMap) {
  const root = {
    name: "root",
    path: "",
    children: {},
    files: [],
    totalUniqueFiles: 0,
  };

  for (const file of files) {
    const metadata = metadataMap[file];
    if (!metadata.tags || metadata.tags.trim() === "") {
      root.files.push(file);
      continue;
    }
    const tagsList = metadata.tags.split(", ");
    for (const tagPath of tagsList) {
      const parts = tagPath.split("/");
      let currentNode = root;
      let currentPath = "";
      for (let j = 0; j < parts.length; j++) {
        const part = parts[j];
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        if (!currentNode.children[part]) {
          currentNode.children[part] = {
            name: part,
            path: currentPath,
            children: {},
            files: [],
            totalUniqueFiles: 0,
          };
        }
        currentNode = currentNode.children[part];
        if (j === parts.length - 1 && !currentNode.files.includes(file)) {
          currentNode.files.push(file);
        }
      }
    }
  }

  const calculateFileCounts = (node) => {
    const uniqueFiles = new Set(node.files);
    for (const childKey in node.children) {
      const childUniqueFiles = calculateFileCounts(node.children[childKey]);
      for (const file of childUniqueFiles) {
        uniqueFiles.add(file);
      }
    }
    node.totalUniqueFiles = uniqueFiles.size;
    return uniqueFiles;
  };
  calculateFileCounts(root);
  return root;
}

/* -----------------------------------------------
   Folder Structure Helpers
----------------------------------------------- */

// Retrieve all folder paths (e.g. "", "foo", "foo/bar") from the folder structure.
function getAllFolderPaths(folderStructure) {
  const paths = new Set([""]); // Include root
  const traverse = (node, currentPath) => {
    paths.add(currentPath);
    for (const childKey in node.children) {
      traverse(node.children[childKey], node.children[childKey].path);
    }
  };
  traverse(folderStructure, "");
  return Array.from(paths);
}

// Get all files that belong to a given folder (including subfolders).
function getFilesForFolder(folderStructure, folderPath) {
  let currentNode = folderStructure;
  if (folderPath !== "") {
    const parts = folderPath.split("/");
    for (const part of parts) {
      if (currentNode.children[part]) {
        currentNode = currentNode.children[part];
      } else {
        console.warn(`Folder path not found: ${folderPath}`);
        return [];
      }
    }
  }
  const allFiles = new Set();
  const collectFiles = (node) => {
    node.files.forEach(file => allFiles.add(file));
    for (const childKey in node.children) {
      collectFiles(node.children[childKey]);
    }
  };
  collectFiles(currentNode);
  console.log(`Collected ${allFiles.size} files for folder: ${folderPath || "root"}`);
  return Array.from(allFiles);
}

/* -----------------------------------------------
   Main Static Data Generation
----------------------------------------------- */

async function generateStaticData() {
  try {
    console.log("Starting static data generation...");

    // Delete previously generated folders.
    await Promise.all([
      deleteFolder(HTML_OUTPUT_DIR),
      deleteFolder(FOLDERS_DIR),
      deleteFolder(ATTACHMENTS_DIR)
    ]);

    // Ensure required directories exist.
    await Promise.all([
      ensureDir(HTML_OUTPUT_DIR),
      ensureDir(FOLDERS_DIR),
      ensureDir(ATTACHMENTS_DIR)
    ]);

    // Convert all Markdown files to HTML.
    const allFiles = await fsPromises.readdir(CONTENTS_DIR);
    const markdownFiles = allFiles.filter(file => file.toLowerCase().endsWith(".md"));
    for (const file of markdownFiles) {
      await convertMarkdownToHtml(path.join(CONTENTS_DIR, file), file);
    }

    // Process all generated HTML files.
    const htmlFiles = (await fsPromises.readdir(CONTENTS_DIR)).filter(file => file.toLowerCase().endsWith(".html"));
    console.log(`Found ${htmlFiles.length} HTML files`);

    const metadataMap = {};
    const fileDetailsMap = {};

    for (const file of htmlFiles) {
      console.log(`Processing ${file}...`);
      const filePath = path.join(CONTENTS_DIR, file);
      const content = await fsPromises.readFile(filePath, "utf8");

      const metadata = extractMetadata(content);
      metadataMap[file] = metadata;

      const hasAttachments = await checkAttachmentFolder(file);
      const { imageAttachments } = hasAttachments
        ? await processAttachments(file, content)
        : { imageAttachments: [] };

      fileDetailsMap[file] = {
        metadata,
        hasAttachments,
        rawHtml: content,
        imageAttachments,
      };

      const jsonFilePath = path.join(HTML_OUTPUT_DIR, `${file}.json`);
      await fsPromises.writeFile(jsonFilePath, JSON.stringify({
        metadata,
        hasAttachments,
        rawHtml: content,
      }));
    }

    // Generate overall folder structure.
    const folderStructure = await generateFolderStructure(htmlFiles, metadataMap);
    await fsPromises.writeFile(path.join(FOLDERS_DIR, "folder-structure.json"), JSON.stringify(folderStructure));

    // For each folder, generate two separate JSON files: index.json and search-index.json.
    for (const folderPath of getAllFolderPaths(folderStructure)) {
      const filesInFolder = getFilesForFolder(folderStructure, folderPath);
      console.log(`Processing folder: ${folderPath || "root"}, found ${filesInFolder.length} files`);

      // Prepare file details including rawHtml (for search indexing).
      const fileDetails = filesInFolder.map(file => {
        const details = fileDetailsMap[file];
        const meta = metadataMap[file] || {
          title: file,
          created: "",
          modified: "",
          tags: "",
          uniqueId: "",
          lastDevice: "",
        };
        return {
          file,
          metadata: meta,
          hasAttachments: details?.hasAttachments || false,
          imageAttachments: details?.imageAttachments || [],
          rawHtml: details?.rawHtml || ""
        };
      });

      // Sort file details by title.
      fileDetails.sort((a, b) => (a.metadata.title || a.file).localeCompare(b.metadata.title || b.file));

      // Build Lunr search index for this folder.
      const idx = lunr(function () {
        this.ref('file');
        this.field('title');
        this.field('content');
        fileDetails.forEach(doc => {
          this.add({
            file: doc.file,
            title: doc.metadata.title,
            content: stripHtml(doc.rawHtml)
          });
        });
      });

      // Determine output paths for folder index and search index.
      let indexOutputPath, searchIndexOutputPath;
      if (folderPath === "") {
        indexOutputPath = path.join(FOLDERS_DIR, "index.json");
        searchIndexOutputPath = path.join(FOLDERS_DIR, "search-index.json");
      } else {
        const folderDir = path.join(FOLDERS_DIR, ...folderPath.split("/"));
        await ensureDir(folderDir);
        indexOutputPath = path.join(folderDir, "index.json");
        searchIndexOutputPath = path.join(folderDir, "search-index.json");
      }

      // Prepare the folder index JSON (omit rawHtml from file details).
      const folderIndex = {
        files: fileDetails.map(({ rawHtml, ...rest }) => rest),
        total: fileDetails.length,
        hasMore: false
      };

      await fsPromises.writeFile(indexOutputPath, JSON.stringify(folderIndex));
      console.log(`Wrote folder index for ${folderPath || "root"} to ${indexOutputPath}`);

      // Write the search index JSON.
      await fsPromises.writeFile(searchIndexOutputPath, JSON.stringify(idx.toJSON()));
      console.log(`Wrote search index for ${folderPath || "root"} to ${searchIndexOutputPath}`);
    }

    console.log("Static data generation complete!");
  } catch (error) {
    console.error("Error generating static data:", error);
    process.exit(1);
  }
}

// Run the static data generation.
generateStaticData().catch(console.error);
