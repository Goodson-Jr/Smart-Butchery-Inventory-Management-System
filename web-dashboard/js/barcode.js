// Shared barcode-scan modal, backed by the html5-qrcode library (loaded via CDN
// in pages that need it). Mirrors the Android app's CameraX/ML Kit scanner.
let _scanInstance = null;

function openScanModal(onDetected) {
    const overlay = document.getElementById('scanOverlay');
    overlay.hidden = false;

    _scanInstance = new Html5Qrcode('scanReader');
    _scanInstance.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText) => {
            closeScanModal();
            onDetected(decodedText);
        },
        () => { /* per-frame scan failures are normal, ignore */ }
    ).catch((err) => {
        alert('Could not start camera: ' + err);
        closeScanModal();
    });
}

function closeScanModal() {
    const overlay = document.getElementById('scanOverlay');
    overlay.hidden = true;
    if (_scanInstance) {
        _scanInstance.stop().then(() => _scanInstance.clear()).catch(() => {});
        _scanInstance = null;
    }
}

function scanModalHtml() {
    return `
    <div id="scanOverlay" class="modal-overlay" hidden>
        <div class="scan-modal">
            <div class="scan-head">
                <span>Point the camera at a barcode</span>
                <span class="close" onclick="closeScanModal()">&times;</span>
            </div>
            <div id="scanReader"></div>
        </div>
    </div>`;
}
