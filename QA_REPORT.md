# Drawzy - Comprehensive QA Report

This report outlines issues discovered during a thorough code review of the Drawzy application, categorized by severity and domain.

## 1. Security Vulnerabilities

### High Severity: Cross-Site Scripting (XSS) in History Tab
- **Location:** `app.js` - `renderHistory()` function.
- **Description:** When rendering the history tab, the application uses `innerHTML` to inject HTML strings containing winner names (`<span class="hi-name">${h.name}</span>`). Since names can be imported from files (CSV, Excel, TXT, DOCX), a malicious user could include a payload (e.g., `<img src=x onerror=alert(1)>`) in the imported file. When that name wins and history is opened, the script will execute in the browser.
- **Recommendation:** Use `textContent` or `innerText` to set text values, or sanitize the `h.name` string (e.g., replacing `<` and `>`) before interpolating it into the `innerHTML` string.

### Medium Severity: Potential Denial of Service (Zip Bomb)
- **Location:** `app.js` - `processZip(file)` function.
- **Description:** When processing ZIP files for import, the app loads files without checking their uncompressed size or the total number of files. A maliciously crafted ZIP (zip bomb) could cause the browser to consume excessive memory (OOM) and crash the user's tab or browser.
- **Recommendation:** Implement limits on the number of processed files (e.g., max 1000) and the maximum size per file/blob before fully extracting it into memory.

## 2. Memory Leaks & Performance Issues

### High Severity: Missing Object URL Revocation
- **Location:** `app.js` - Various (`processZip`, `applyBg`, `applyLogo`, Audio inputs).
- **Description:** The app uses `URL.createObjectURL(file)` extensively (for ZIP photos, custom backgrounds, logos, and custom sounds) but **never calls `URL.revokeObjectURL()`**. This causes memory leaks in the browser because the memory allocated for these blobs is never freed until the tab is closed. Repeatedly changing backgrounds or uploading ZIP files will steadily increase memory usage.
- **Recommendation:** Keep references to created object URLs and call `URL.revokeObjectURL(oldUrl)` before creating a new one and when clearing items (like `clearHistoryBtn` or `photoClearBtn`).

### Medium Severity: Inefficient Font Sizing for Long Names
- **Location:** `app.js` - `drawWheelOn()` function.
- **Description:** When drawing names on the wheel, the app uses a `while` loop (`while(fs>8&&c2d.measureText(name).width>availLen) { fs--; ... }`) to iteratively measure and shrink the font size. For wheels with many entries or unusually long names, this loop executes thousands of times per frame during the wheel spin, potentially causing frame drops.
- **Recommendation:** Calculate the required font size mathematically or cache the computed font size for each name before the animation starts, instead of calculating it inside the `drawWheelOn` render loop.

## 3. Stability and Error Handling

### High Severity: LocalStorage Exception unhandled
- **Location:** `i18n.js` - `localStorage.getItem('raffleLang')` & `localStorage.setItem`.
- **Description:** The app accesses `localStorage` directly in the global scope. If the user has strict privacy settings that block third-party cookies/data (common in Brave, Safari, or incognito mode), this will throw a `SecurityError: The operation is insecure` and completely halt script execution. The app will fail to load or function.
- **Recommendation:** Wrap `localStorage` calls in a `try...catch` block.

### Medium Severity: `contenteditable` Formatting Bugs
- **Location:** `app.js` - `namesBox` interaction.
- **Description:** The names input box is a `contenteditable="true"` element. If a user pastes formatted text (e.g., from Word or a web page), it retains HTML formatting (like `<div>` or `<b>`). While `innerText` strips tags for the actual array, the visual display can become severely mangled.
- **Recommendation:** Listen to the `paste` event on `namesBox`, prevent the default behavior, and insert only plain text.

## 4. UI / UX and Accessibility (A11y)

### Medium Severity: Unresponsive Sidebar Width
- **Location:** `style.css` - `.sidebar`.
- **Description:** The sidebar has a fixed width of `370px`. On very narrow mobile devices (e.g., iPhone SE with 320px width), the sidebar will exceed the screen width. The close button may become unreachable or cause horizontal scrolling.
- **Recommendation:** Change the width to `width: min(370px, 100vw);` or use media queries.

### Low Severity: Confetti Canvas doesn't resize
- **Location:** `app.js` - `launchConfetti()`
- **Description:** The confetti canvas size is only set when the confetti is launched. If the user resizes the window or rotates their device while the confetti is falling, the canvas size will be incorrect, leading to visual clipping.
- **Recommendation:** Add an event listener to resize the `cfCanvas` if it's currently active.

### Low Severity: Excel Import Limitation
- **Location:** `app.js` - `readExcel()`
- **Description:** The Excel import strictly reads only the very first sheet (`wb.Sheets[wb.SheetNames[0]]`). If a user uploads an Excel file where their data is on the second sheet, they will silently get no names or incorrect names.
- **Recommendation:** Provide UI feedback on which sheet is being read, or iterate through sheets to find the first one containing data.

### Low Severity: Accessibility Deficiencies
- **Location:** `index.html`
- **Description:** Interactive elements like the hamburger menu button (`#menuBtn`) lack `aria-label` attributes. Screen readers will not announce the button's purpose effectively. Input sliders lack `<label>` associations that are properly linked via `for="id"`.
- **Recommendation:** Add appropriate `aria-label` tags (e.g., `aria-label="Open Menu"`) to icon-only buttons. Add `for` attributes to labels.

## 5. Code Quality and Maintainability

### Medium Severity: Heavily Minified-style Source Code
- **Location:** `app.js`
- **Description:** The source code in `app.js` is written in an extremely dense, almost minified style, with multiple statements on single lines, no empty lines between logical blocks, and heavily abbreviated variable names (e.g., `const c=$('wheelCanvas'),ctx=canvas.getContext('2d');`). This makes maintenance, debugging, and future feature additions extremely difficult.
- **Recommendation:** Run the code through a code formatter (like Prettier) to restore standard indentation, line breaks, and readability. Use a build step to minify code for production rather than writing it this way manually.
