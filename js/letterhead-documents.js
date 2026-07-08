/**
 * Letterhead Documents - adds the Ray2Volt letterhead image to every PDF page.
 */
document.addEventListener('DOMContentLoaded', () => {
    const LETTERHEAD_SRC = '../assets/Letterhead (Latest) Ray2Volt Solar PNG.png';

    const pdfInput = document.getElementById('lhdPdfInput');
    const processBtn = document.getElementById('lhdProcessBtn');
    const fileTitle = document.getElementById('lhdFileTitle');
    const fileMeta = document.getElementById('lhdFileMeta');
    const status = document.getElementById('lhdStatus');

    let selectedFile = null;

    pdfInput?.addEventListener('change', () => {
        selectedFile = pdfInput.files && pdfInput.files.length ? pdfInput.files[0] : null;

        if (!selectedFile) {
            setFileSummary('Choose PDF', 'No file selected');
            setStatus('Waiting for a PDF.');
            if (processBtn) processBtn.disabled = true;
            return;
        }

        if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
            setFileSummary('Unsupported file', selectedFile.name);
            setStatus('Please choose a PDF file.', 'error');
            if (processBtn) processBtn.disabled = true;
            return;
        }

        setFileSummary(selectedFile.name, formatBytes(selectedFile.size));
        setStatus('Ready to add the letterhead.');
        if (processBtn) processBtn.disabled = false;
    });

    processBtn?.addEventListener('click', async () => {
        if (!selectedFile) {
            setStatus('Please choose a PDF first.', 'error');
            return;
        }

        if (!window.PDFLib || !window.PDFLib.PDFDocument) {
            setStatus('PDF processing library did not load. Check your internet connection and reload.', 'error');
            return;
        }

        try {
            processBtn.disabled = true;
            setStatus('Adding letterhead to every page...', 'busy');

            const { PDFDocument } = window.PDFLib;
            const [pdfBytes, letterheadBytes] = await Promise.all([
                selectedFile.arrayBuffer(),
                loadLetterheadBytes()
            ]);

            const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
            const letterhead = await pdfDoc.embedPng(letterheadBytes);
            const pages = pdfDoc.getPages();

            pages.forEach(page => {
                const { width, height } = page.getSize();
                page.drawImage(letterhead, {
                    x: 0,
                    y: 0,
                    width,
                    height
                });
            });

            const outputBytes = await pdfDoc.save();
            downloadPdf(outputBytes, buildOutputName(selectedFile.name));
            setStatus(`Done. Added letterhead to ${pages.length} page${pages.length === 1 ? '' : 's'}.`, 'success');
        } catch (error) {
            console.error(error);
            if (error?.message === 'LETTERHEAD_ASSET_LOAD_FAILED') {
                setStatus('Could not load the letterhead image. Reload the page and try again.', 'error');
            } else {
                setStatus('Could not process this PDF. Make sure it is not password-protected or corrupted.', 'error');
            }
        } finally {
            processBtn.disabled = false;
        }
    });

    async function loadLetterheadBytes() {
        try {
            return await loadLetterheadViaFetch();
        } catch (error) {
            console.warn('Letterhead fetch failed; trying image fallback.', error);
        }

        try {
            return await loadLetterheadViaImage();
        } catch (error) {
            console.error('Letterhead image fallback failed.', error);
            throw new Error('LETTERHEAD_ASSET_LOAD_FAILED');
        }
    }

    async function loadLetterheadViaFetch() {
        const response = await fetch(LETTERHEAD_SRC);

        if (!response.ok) {
            throw new Error(`Failed to load letterhead asset: ${response.status}`);
        }

        return response.arrayBuffer();
    }

    function loadLetterheadViaImage() {
        return new Promise((resolve, reject) => {
            const image = new Image();

            image.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = image.naturalWidth;
                    canvas.height = image.naturalHeight;

                    const context = canvas.getContext('2d');
                    if (!context) {
                        reject(new Error('Canvas context unavailable'));
                        return;
                    }

                    context.drawImage(image, 0, 0);
                    canvas.toBlob(async blob => {
                        if (!blob) {
                            reject(new Error('Canvas could not export letterhead PNG'));
                            return;
                        }

                        resolve(await blob.arrayBuffer());
                    }, 'image/png');
                } catch (error) {
                    reject(error);
                }
            };

            image.onerror = () => reject(new Error('Letterhead image failed to load'));
            image.src = LETTERHEAD_SRC;
        });
    }

    function downloadPdf(bytes, filename) {
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    function buildOutputName(filename) {
        const cleanName = filename.replace(/\.pdf$/i, '');
        return `${cleanName}-letterhead.pdf`;
    }

    function setFileSummary(title, meta) {
        if (fileTitle) fileTitle.textContent = title;
        if (fileMeta) fileMeta.textContent = meta;
    }

    function setStatus(message, state = '') {
        if (!status) return;

        status.textContent = message;
        status.classList.remove('success', 'error', 'busy');

        if (state) {
            status.classList.add(state);
        }
    }

    function formatBytes(bytes) {
        if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';

        const units = ['B', 'KB', 'MB', 'GB'];
        const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
        const value = bytes / Math.pow(1024, index);
        return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
    }
});
