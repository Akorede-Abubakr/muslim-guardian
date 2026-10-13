# Original document pages

The reader displays a PNG rendered from each PDF page. It does not reflow the
document into paragraphs. Text extraction remains available for accessibility
and LightBridge AI retrieval.

Upload the publisher's PDF using the existing admin manuscript picker. For Word
documents, export to PDF in Word for the closest match to the author's fonts and
pagination. The previous artificial Word reading pages cannot recreate the
original layout; reupload the PDF to the same book record to retain purchases.

Optional automatic Word conversion requires LibreOffice installed on the backend
host and `LIBREOFFICE_BIN` pointing to its executable. The default executable is
`libreoffice` on Linux and `C:\Program Files\LibreOffice\program\soffice.exe` on
Windows. Install the document's fonts on that host as well. Missing fonts can
change Word pagination. If conversion is unavailable, the upload returns an
actionable PDF-export error and retains the previously published edition.

PDF rendering uses `pdfjs-dist` and `@napi-rs/canvas`, with a time-limited child
process per request and at most two renders concurrently per backend process.
Keep npm optional platform dependencies enabled when installing on the host.
No external viewer receives book contents. Each image request uses the existing
authentication and purchase/preview rules; the full source PDF is never sent to
a preview visitor. Responses use `Cache-Control: private, no-store`.

Original manuscripts and converted reader PDFs remain in private MongoDB GridFS.
Temporary conversion/rendering files are removed after each operation. The
backend needs writable OS temporary storage; no public file directory is used.

The reader toolbar's LightBridge AI button opens the existing book assistant.
It retains the selected book and page context and its existing access rules.
