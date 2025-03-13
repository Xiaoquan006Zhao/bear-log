
# Bear-Log
Aims to create an easy way to share (read-only) your Bear Notes online with the community in a near-Bear visual style. 

You can check my notes at: https://xiaoquan-notes.netlify.app/ or https://xiaoquan006zhao.github.io/xiaoquan-notes/
<img width="1511" alt="image" src="https://github.com/user-attachments/assets/fb085915-140d-4691-9404-bd2befaf1611" />

# How to use
1. `git clone` the bear-log project
2. Create a `contents` folder at root
3. Export your bear notes as `.html` (requires pro) or `.md` (does not require pro). You can find more information at https://bear.app/faq/export-your-notes/
   1. Remember to check the box `Export attachments` otherwise no images will show up
4. Put the exported notes into the `contents` folder
5. `git push`
6. For first-time use, you will need to
    1. **Either** Set-up github workflow action and change the build process from `next build` to `npm run build` in the `nextjs.yml`
    2. **Or** Deploy to Netlify and avoid the setup by following https://www.netlify.com/blog/2016/09/29/a-step-by-step-guide-deploying-on-netlify/
7. You *Will* need to re-export and put them in the `contents` folder and `git push` *if you want to change the shared notes.*

# Supported Features
1. Folder-structure generated from #tag
2. Image attchments preview
3. Table of Content Navigation
4. Header folding

# Not So Supported Feature
6. Searching(Filtering) Notes within current folder (achieved by `flexsearch` though the default setting has limited language support and no OCR search).
7. No highlighting matched terms, I would suggest use the browser's `Ctrl+F` or `Cmd+F` if you need it.
8. No Folder icon 
9. No custom themes (limited by the Bear export process)
10. If you export as `.md` files, the dates will be unavailable and styling might be a little different.

---
This project is built with many help from [v0.dev ](https://v0.dev/)
