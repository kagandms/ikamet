// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    // --- Login System ---
    const loginOverlay = document.getElementById('login-overlay');
    const appContent = document.getElementById('app-content');
    const loginPassword = document.getElementById('login-password');
    const loginError = document.getElementById('login-error');

    window.checkLogin = function() {
        if (loginPassword.value === 'tapşıranlar61') {
            sessionStorage.setItem('auth', 'true');
            loginOverlay.style.display = 'none';
            appContent.style.display = 'block';
        } else {
            loginError.style.display = 'block';
            loginPassword.value = '';
        }
    };

    if (sessionStorage.getItem('auth') === 'true') {
        loginOverlay.style.display = 'none';
        appContent.style.display = 'block';
    } else {
        loginOverlay.style.display = 'flex';
        appContent.style.display = 'none';
    }

    // --- DOM Elements ---
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-input');
    const fileInputPage2 = document.getElementById('file-input-page2');
    const cameraBtn = document.getElementById('camera-btn');
    const previewImage = document.getElementById('preview-image');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const toastContainer = document.getElementById('toast-container');
    
    let isProcessingPage2 = false;

    // Steps
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const step3 = document.getElementById('step-3');
    
    // Buttons
    const btnRescan = document.getElementById('btn-rescan');
    const btnClear = document.getElementById('btn-clear');
    const btnDownload = document.getElementById('btn-download');

    // Form Fields
    const fields = {
        basvuruNo: document.getElementById('field-basvuru-no'),
        teslimTarihi: document.getElementById('field-teslim-tarihi'),
        yabanciKimlik: document.getElementById('field-yabanci-kimlik'),
        pasaportNo: document.getElementById('field-pasaport-no'),
        adi: document.getElementById('field-adi'),
        soyadi: document.getElementById('field-soyadi'),
        uyrugu: document.getElementById('field-uyrugu'),
        dogumTarihi: document.getElementById('field-dogum-tarihi'),
        adres: document.getElementById('field-adres'),
        tel: document.getElementById('field-tel'),
        mail: document.getElementById('field-mail')
    };

    // --- Toast System ---
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        // Icon based on type
        let icon = 'ℹ️';
        if (type === 'success') icon = '✅';
        if (type === 'error') icon = '❌';

        toast.textContent = `${icon} ${message}`;
        
        if (toastContainer) {
            toastContainer.appendChild(toast);
        } else {
            document.body.appendChild(toast);
        }

        // Trigger show animation
        requestAnimationFrame(() => toast.classList.add('show'));

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }


    // --- Step Management ---
    function setActiveStep(stepNumber) {
        [step1, step2, step3].forEach((section, index) => {
            if (section) {
                section.classList.remove('active', 'hidden');
                if (index + 1 === stepNumber) {
                    section.classList.add('active');
                }
            }
        });

        [1, 2, 3].forEach(num => {
            const indicator = document.getElementById(`indicator-${num}`);
            if (indicator) {
                indicator.classList.remove('active', 'completed');
                if (num < stepNumber) indicator.classList.add('completed');
                if (num === stepNumber) indicator.classList.add('active');
            }
        });
    }

    // Initial setup
    setActiveStep(1);

    // Set default date for teslim tarihi
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    if (fields.teslimTarihi) fields.teslimTarihi.value = `${dd}.${mm}.${yyyy}`;

    // --- Image Upload & Camera ---
    
    // Trigger file input when clicking the zone (if no child clicked specifically)
    if (uploadZone) {
        uploadZone.addEventListener('click', (e) => {
            if (e.target !== cameraBtn) {
                fileInput.removeAttribute('capture');
                fileInput.click();
            }
        });

        // Drag and Drop
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('dragover');
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleFile(e.dataTransfer.files[0]);
            }
        });
    }

    if (cameraBtn) {
        cameraBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            fileInput.setAttribute('capture', 'environment');
            fileInput.click();
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                isProcessingPage2 = false;
                handleFile(e.target.files[0]);
            }
            // Reset capture attribute for next time
            fileInput.removeAttribute('capture');
        });
    }

    if (fileInputPage2) {
        fileInputPage2.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                isProcessingPage2 = true;
                handleFile(e.target.files[0]);
            }
        });
    }

    const miniDropzone = document.getElementById('mini-dropzone');
    if (miniDropzone) {
        miniDropzone.addEventListener('click', () => {
            if (fileInputPage2) fileInputPage2.click();
        });
        
        miniDropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            miniDropzone.classList.add('dragover');
        });

        miniDropzone.addEventListener('dragleave', () => {
            miniDropzone.classList.remove('dragover');
        });

        miniDropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            miniDropzone.classList.remove('dragover');
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                isProcessingPage2 = true;
                handleFile(e.dataTransfer.files[0]);
            }
        });
    }

    // Paste for screenshots
    document.addEventListener('paste', (e) => {
        if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
            handleFile(e.clipboardData.files[0]);
        }
    });

    function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            showToast('Lütfen geçerli bir resim dosyası yükleyin.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                if (previewImage) {
                    previewImage.src = img.src;
                    previewImage.style.display = 'block';
                }
                processAndRunOCR(img);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // --- Image Pre-processing ---
    function processAndRunOCR(img) {
        setActiveStep(2);
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Resize if width > 2000px (Optimized for OCR)
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 2000;
        
        if (width > MAX_WIDTH) {
            const ratio = MAX_WIDTH / width;
            width = MAX_WIDTH;
            height = height * ratio;
        }
        
        // Ensure integer dimensions
        width = Math.floor(width);
        height = Math.floor(height);

        canvas.width = width;
        canvas.height = height;

        // Apply a slight blur natively to merge thermal/dot-matrix printer gaps
        ctx.filter = 'blur(1px)';
        ctx.drawImage(img, 0, 0, width, height);
        ctx.filter = 'none'; // reset
        
        // Apply Bradley-Roth Adaptive Thresholding (to defeat shadows and preserve thin text)
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const intImg = new Int32Array(width * height);
        const S = Math.floor(width / 8); // Larger Window size
        const s2 = Math.floor(S / 2);
        const T = 0.10; // Lower Threshold percentage to make text darker (survive better)
        
        // Convert to grayscale
        const gray = new Uint8Array(width * height);
        for (let i = 0; i < width * height; i++) {
            gray[i] = 0.299 * data[i*4] + 0.587 * data[i*4+1] + 0.114 * data[i*4+2];
        }
        
        // Calculate integral image directly from gray
        for (let i = 0; i < width; i++) {
            let sum = 0;
            for (let j = 0; j < height; j++) {
                const index = j * width + i;
                sum += gray[index];
                if (i === 0) intImg[index] = sum;
                else intImg[index] = intImg[index - 1] + sum;
            }
        }
        
        // Apply threshold using gray image
        for (let i = 0; i < width; i++) {
            for (let j = 0; j < height; j++) {
                const index = j * width + i;
                
                const x1 = Math.max(i - s2, 0);
                const x2 = Math.min(i + s2, width - 1);
                const y1 = Math.max(j - s2, 0);
                const y2 = Math.min(j + s2, height - 1);
                
                const count = (x2 - x1) * (y2 - y1);
                let sum = intImg[y2 * width + x2] - (y1 > 0 ? intImg[(y1-1) * width + x2] : 0) - (x1 > 0 ? intImg[y2 * width + (x1-1)] : 0) + ((x1 > 0 && y1 > 0) ? intImg[(y1-1) * width + (x1-1)] : 0);
                
                if (gray[index] * count <= sum * (1.0 - T)) {
                    // Black
                    data[index*4] = 0;
                    data[index*4+1] = 0;
                    data[index*4+2] = 0;
                } else {
                    // White
                    data[index*4] = 255;
                    data[index*4+1] = 255;
                    data[index*4+2] = 255;
                }
                data[index*4+3] = 255; // Alpha
            }
        }

        // --- LINE REMOVAL ALGORITHM ---
        // Erase long horizontal and vertical lines (table borders) so Tesseract doesn't mistake text for graphics
        // Horizontal
        for (let y = 0; y < height; y++) {
            let run = 0;
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                if (data[idx] === 0) run++;
                else {
                    if (run > 80) { // If continuous black pixels > 80, it's a line
                        for (let k = 1; k <= run; k++) {
                            const eraseIdx = (y * width + (x - k)) * 4;
                            data[eraseIdx] = 255; data[eraseIdx+1] = 255; data[eraseIdx+2] = 255;
                        }
                    }
                    run = 0;
                }
            }
        }
        // Vertical
        for (let x = 0; x < width; x++) {
            let run = 0;
            for (let y = 0; y < height; y++) {
                const idx = (y * width + x) * 4;
                if (data[idx] === 0) run++;
                else {
                    if (run > 80) {
                        for (let k = 1; k <= run; k++) {
                            const eraseIdx = ((y - k) * width + x) * 4;
                            data[eraseIdx] = 255; data[eraseIdx+1] = 255; data[eraseIdx+2] = 255;
                        }
                    }
                    run = 0;
                }
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // --- DEBUG: Show the binarized image on the screen ---
        const existingDebug = document.getElementById('debug-canvas');
        if (existingDebug) existingDebug.remove();
        canvas.id = 'debug-canvas';
        canvas.style.width = '100%';
        canvas.style.marginTop = '20px';
        canvas.style.border = '2px solid red';
        const debugContainer = document.querySelector('.ocr-debug');
        if (debugContainer) debugContainer.appendChild(canvas);
        
        // Start OCR directly passing the binarized canvas
        runOCR(canvas);
    }

    // --- OCR Processing ---
    async function runOCR(imageSource) {
        try {
            if (progressBar) progressBar.style.width = '0%';
            if (progressText) progressText.innerText = 'OCR başlatılıyor...';

            // Wait a moment for UI to update
            await new Promise(resolve => setTimeout(resolve, 100));

            // Use tur+eng to help with foreign names, disable dictionary bias
            const worker = await Tesseract.createWorker(['tur', 'eng'], 1, {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        const p = Math.round(m.progress * 100);
                        if (progressBar) progressBar.style.width = p + '%';
                        if (progressText) progressText.innerText = 'Okunuyor... %' + p;
                    }
                }
            });

            // PSM 6: Single uniform block (best for forms without table borders)
            await worker.setParameters({
                tessedit_pageseg_mode: '6',
                load_system_dawg: '0',
                load_freq_dawg: '0'
            });

            const result = await worker.recognize(imageSource);
            await worker.terminate();

            const text = result.data.text;
            if (progressText) progressText.innerText = 'İşlem tamamlandı!';
            
            // Log raw text for debugging
            const rawTextEl = document.getElementById('ocr-raw-text');
            if (rawTextEl) rawTextEl.textContent = text;
            
            extractFields(text);
            showToast('OCR işlemi başarıyla tamamlandı.', 'success');
            setActiveStep(3);

        } catch (error) {
            console.error("OCR Error:", error);
            showToast('OCR işlemi başarısız. Lütfen daha net bir fotoğraf yükleyin.', 'error');
            setActiveStep(1);
        }
    }

    // --- Field Extraction ---
    function extractFields(text) {
        // Normalize newlines for easier regex matching
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        const fullText = lines.join('\n');
        
        if (typeof isProcessingPage2 !== 'undefined' && isProcessingPage2) {
            // Extract Tel No
            const telMatch = fullText.match(/(?:0|\+90|90)?\s*[\(\s]*([5][0-9]{2})[\)\s]*([0-9]{3})[\s]*([0-9]{2})[\s]*([0-9]{2})/);
            if (telMatch) {
                const telField = document.getElementById('field-tel');
                if (telField) {
                    telField.value = `0${telMatch[1]} ${telMatch[2]} ${telMatch[3]} ${telMatch[4]}`;
                    telField.classList.add('field-filled');
                }
            }

            // Extract Address
            let adresMatch = fullText.match(/(?:Adres|Address)[\s:;.-]*([^]*?)(?:Tel|Mail|E-posta|UETS|$)/i);
            if (adresMatch && adresMatch[1].trim().length > 5) {
                const adresField = document.getElementById('field-adres');
                if (adresField) {
                    adresField.value = adresMatch[1].replace(/\n/g, ' ').trim().substring(0, 100);
                    adresField.classList.add('field-filled');
                }
            } else {
                const istMatch = fullText.match(/.*?(İstanbul.*?)(?:Tel|Mail|$)/is);
                if (istMatch && istMatch[1].length > 5) {
                    const adresField = document.getElementById('field-adres');
                    if (adresField) {
                        adresField.value = istMatch[1].replace(/\n/g, ' ').substring(0, 100).trim();
                        adresField.classList.add('field-filled');
                    }
                }
            }
            
            isProcessingPage2 = false;
            return;
        }
        
        const extracted = {
            basvuruNo: '', pasaportNo: '', adi: '', soyadi: '', uyrugu: '', dogumTarihi: ''
        };

        // Known form label words — stops name extraction at right-column labels
        const formLabels = /^(di[gğ]er|other|citizenship|uyru[gğ]u|nationality|do[gğ]um(?:daki)?|born|[öo]nceki|previous|surname|name|father|mother|baba|anne|cinsiyet|gender|medeni|marital|uets|yeri|[üu]lkesi|country|kimlik|foreigner|place|foreign|date|tarihi|hali|status|biyo(?:metrik)?|number|document|belge|kay[ıi]t|registration|[iİ]kamet|ba[sş]vuru|randevu|talep|seyahat|travel|information|type|t[üu]r[üu]|foto[gğ]raf|numara|soyad[ıi]?|ad[ıi])$/i;

        // Helper: grab consecutive name words, stopping at form labels.
        // Tolerates 1 lowercase OCR error per word.
        const grabName = (str) => {
            const words = str.split(/[\s,;:]+/).filter(w => w.length > 0);
            const result = [];
            for (const word of words) {
                if (result.length >= 4) break;
                if (formLabels.test(word)) break;
                const upperCount = (word.match(/[A-ZÇĞİÖŞÜ]/g) || []).length;
                const isNameWord = word.length >= 2
                    && upperCount >= Math.max(1, word.length - 1)
                    && /^[A-ZÇĞİÖŞÜa-zçğıöşü'\-]+$/.test(word);
                if (isNameWord) {
                    result.push(word.toUpperCase());
                } else if (result.length > 0) {
                    break;
                }
            }
            return result.join(' ');
        };

        // ============================================
        // 1. BAŞVURU NO (Kayıt Numarası)
        //    Format: YYYY-NN-NNNNNNN (e.g. 2026-88-0638278)
        // ============================================

        // Strategy A: GCGM barcode text (most reliable, always on the form)
        // e.g. GCGM03-92026880638278 → 2026-88-0638278
        const barcodeMatch = fullText.match(/GC[CG]M\d+[-–]?\d(\d{4})(\d{2})(\d{7})/i);
        if (barcodeMatch) {
            extracted.basvuruNo = `${barcodeMatch[1]}-${barcodeMatch[2]}-${barcodeMatch[3]}`;
        }

        // Strategy B: Label-anchored (near "Kayıt Numarası" / "Registration Number")
        if (!extracted.basvuruNo) {
            const labelMatch = fullText.match(
                /(?:Kay[ıi]t\s*(?:Numaras[ıi]|No)|Registration\s*(?:Number|No))[^\d]{0,30}(\d{4})\s*[-–.\s]\s*(\d{2})\s*[-–.\s]\s*(\d{5,7})/i
            );
            if (labelMatch) {
                extracted.basvuruNo = `${labelMatch[1]}-${labelMatch[2]}-${labelMatch[3]}`;
            }
        }

        // Strategy C: Generic YYYY-NN-NNNNNNN anchored to 20XX
        if (!extracted.basvuruNo) {
            const genericMatch = fullText.match(/\b(20\d{2})\s*[-–]\s*(\d{2})\s*[-–]\s*(\d{5,7})\b/);
            if (genericMatch) {
                extracted.basvuruNo = `${genericMatch[1]}-${genericMatch[2]}-${genericMatch[3]}`;
            }
        }

        // OCR digit corrections for başvuru no
        if (extracted.basvuruNo) {
            const parts = extracted.basvuruNo.split('-');
            if (parts.length === 3) {
                parts.forEach((p, idx) => {
                    parts[idx] = p.replace(/[OoQq]/g, '0').replace(/[S\$]/g, '5').replace(/[Z]/g, '2').replace(/[l]/g, '1');
                });
                extracted.basvuruNo = parts.join('-');
            }
        }

        // ============================================
        // 2. SOYADI — multi-word support
        // ============================================
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (/\bSoyad[ıi]\b/i.test(line) && !/[öÖ]nceki/i.test(line)) {
                const m = line.match(/\bSoyad[ıi]\b\s*(.*)/i);
                const afterLabel = m ? m[1] : '';
                const cleaned = afterLabel.replace(/^\/?\.?\s*Surname\s*/i, '');
                const name = grabName(cleaned);
                if (name.length >= 2) { extracted.soyadi = name; break; }

                for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
                    if (/^\/?\.?\s*Surname\s*$/i.test(lines[j])) continue;
                    const nc = lines[j].replace(/^\s*\/?\.?\s*Surname\s*/i, '');
                    const nn = grabName(nc);
                    if (nn.length >= 2) { extracted.soyadi = nn; break; }
                    break;
                }
                break;
            }
        }

        // ============================================
        // 3. ADI — multi-word, excludes Baba/Anne/Soy
        // ============================================
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (/\bAd[ıi]\b/i.test(line) && !/baba|anne|soyad|[öÖ]nceki/i.test(line)) {
                const m = line.match(/\bAd[ıi]\b\s*(.*)/i);
                const afterLabel = m ? m[1] : '';
                const cleaned = afterLabel.replace(/^\/?\.?\s*Name\s*/i, '');
                const name = grabName(cleaned);
                if (name.length >= 2) { extracted.adi = name; break; }

                for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
                    if (/^\/?\.?\s*Name\s*$/i.test(lines[j])) continue;
                    const nc = lines[j].replace(/^\s*\/?\.?\s*Name\s*/i, '');
                    const nn = grabName(nc);
                    if (nn.length >= 2) { extracted.adi = nn; break; }
                    break;
                }
                break;
            }
        }

        // Prevent duplicate
        if (extracted.adi && extracted.adi === extracted.soyadi) {
            extracted.soyadi = '';
        }

        // ============================================
        // 4. UYRUĞU — standalone, skip Diğer/Doğumdaki
        // ============================================
        const uyrukRegex = /\bUyru[gğ]u\b/gi;
        let uM;
        while ((uM = uyrukRegex.exec(fullText)) !== null) {
            const before = fullText.substring(Math.max(0, uM.index - 15), uM.index);
            if (/di[gğ]er|do[gğ]um/i.test(before)) continue;

            const after = fullText.substring(uM.index + uM[0].length, uM.index + uM[0].length + 150);
            const cleaned = after.replace(/^[\s\n]*(?:Nationality)?[\s\n]*/i, '');
            const countryMatch = cleaned.match(/^([A-ZÇĞİÖŞÜa-zçğıöşü]{3,}(?:\s+[A-ZÇĞİÖŞÜa-zçğıöşü]{2,})?)/);
            if (countryMatch) {
                const candidate = countryMatch[1].trim();
                if (!formLabels.test(candidate.split(/\s+/)[0])) {
                    extracted.uyrugu = candidate;
                    break;
                }
            }
        }

        // ============================================
        // 5. DOĞUM TARİHİ
        // ============================================
        const dobMatch = fullText.match(
            /(?:Do[gğ]um\s*Tarihi|Date\s*of\s*Birth)[^\d]{0,30}(3[01]|[12]\d|0?[1-9])\s*[/.\-\s]+\s*(1[0-2]|0?[1-9])\s*[/.\-\s]+\s*(\d{4})/i
        );
        if (dobMatch) {
            extracted.dogumTarihi = `${dobMatch[1].padStart(2, '0')}.${dobMatch[2].padStart(2, '0')}.${dobMatch[3]}`;
        }

        // ============================================
        // 6. PASAPORT NO (Belge No)
        // ============================================
        const belgeMatch = fullText.match(
            /(?:Belge\s*N[oO0]|Number\s*of\s*Document)\s*[:\s\n]*([A-Za-z]?\d{5,12})/i
        );
        if (belgeMatch) {
            let pass = belgeMatch[1].toUpperCase().replace(/\s/g, '');
            if (pass.length >= 5 && !/^INFORMATION$/i.test(pass)) {
                extracted.pasaportNo = pass;
            }
        }

        // Fallback: Letter(s) + digits (e.g. A2596273, P09986286)
        if (!extracted.pasaportNo) {
            const passMatch = fullText.match(/\b([A-Za-z]{1,2}\d{6,9})\b/);
            if (passMatch) {
                const candidate = passMatch[1].toUpperCase();
                if (!/^GC/i.test(candidate)) {
                    extracted.pasaportNo = candidate;
                }
            }
        }

        // OCR corrections for passport digits
        if (extracted.pasaportNo) {
            const lp = extracted.pasaportNo.match(/^([A-Za-z]*)/)[0];
            const dp = extracted.pasaportNo.substring(lp.length);
            extracted.pasaportNo = lp + dp.replace(/[Oo]/g, '0').replace(/[Ss]/g, '5').replace(/[Zz]/g, '2').replace(/[l]/g, '1');
        }

        populateForm(extracted);
    }

    // --- Populate Form ---
    function populateForm(data) {
        // Only auto-fill fields that exist on the Göç İdaresi form
        const mapping = {
            basvuruNo: data.basvuruNo,
            pasaportNo: data.pasaportNo,
            adi: data.adi,
            soyadi: data.soyadi,
            uyrugu: data.uyrugu,
            dogumTarihi: data.dogumTarihi
        };
        // yabanciKimlik, adres, tel, mail are NOT extracted from OCR
        // They remain empty for manual entry

        for (const [key, value] of Object.entries(mapping)) {
            const field = fields[key];
            if (field && value) {
                field.value = value;
                field.classList.add('success');
            }
        }
    }

    // --- Event Listeners ---
    if (btnRescan) {
        btnRescan.addEventListener('click', () => {
            if (fileInput) fileInput.value = '';
            setActiveStep(1);
        });
    }

    if (btnClear) {
        btnClear.addEventListener('click', () => {
            Object.values(fields).forEach(field => {
                if (field && field.id !== 'field-teslim-tarihi') {
                    field.value = '';
                    field.classList.remove('field-filled');
                }
            });
        });
    }

    // Word Document Generation
    if (btnDownload) {
        btnDownload.addEventListener('click', async () => {
            if (typeof docx === 'undefined') {
                showToast('Word kütüphanesi yüklenemedi.', 'error');
                return;
            }
            
            const { Document, Paragraph, Table, TableRow, TableCell, TextRun, AlignmentType, WidthType, BorderStyle, HeadingLevel, Packer, VerticalAlign, TableLayoutType } = window.docx;

            // Get form values
            const getVal = (field) => field ? field.value || ' ' : ' ';
            const vBasvuruNo = getVal(fields.basvuruNo);
            const vTeslim = getVal(fields.teslimTarihi);
            const vYabanciKimlik = getVal(fields.yabanciKimlik);
            const vPasaportNo = getVal(fields.pasaportNo);
            const vAdi = getVal(fields.adi);
            const vSoyadi = getVal(fields.soyadi);
            const vUyrugu = getVal(fields.uyrugu);
            const vDogum = getVal(fields.dogumTarihi);
            const vAdres = getVal(fields.adres);
            const vTel = getVal(fields.tel);
            const vMail = getVal(fields.mail);

            // Table Border Settings
            const tableBorder = {
                top: { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" },
                insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" },
            };

            const doc = new Document({
                creator: "OCR App",
                title: "Ogrenci Kayit Formu",
                styles: {
                    default: {
                        document: {
                            run: {
                                font: "Times New Roman"
                            }
                        }
                    }
                },
                sections: [{
                    properties: {},
                    children: [
                        // Title
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({
                                    text: "İSTANBUL TOPKAPI ÜNİVERSİTESİ",
                                    bold: true,
                                    size: 28 // 14pt (Half-points)
                                })
                            ],
                            spacing: { after: 400 }
                        }),

                        // Table
                        new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            borders: tableBorder,
                            layout: TableLayoutType.FIXED,
                            rows: [
                                // Row 1: Spacer
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            columnSpan: 4,
                                            children: [new Paragraph(" ")],
                                            shading: { fill: "F2F2F2" }
                                        })
                                    ]
                                }),
                                // Row 2
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "e-İkamet Başvuru No", bold: true })] })], verticalAlign: VerticalAlign.CENTER, margins: { top: 100, bottom: 100, left: 100 } }),
                                        new TableCell({ children: [new Paragraph(vBasvuruNo)], verticalAlign: VerticalAlign.CENTER, margins: { top: 100, bottom: 100, left: 100 } }),
                                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Öğrencinin Evraklarını Ofise Teslim Tarihi", bold: true })] })], verticalAlign: VerticalAlign.CENTER, margins: { top: 100, bottom: 100, left: 100 } }),
                                        new TableCell({ children: [new Paragraph(vTeslim)], verticalAlign: VerticalAlign.CENTER, margins: { top: 100, bottom: 100, left: 100 } }),
                                    ]
                                }),
                                // Row 3
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Yabancı Kimlik No", bold: true })] })], verticalAlign: VerticalAlign.CENTER, margins: { top: 100, bottom: 100, left: 100 } }),
                                        new TableCell({ children: [new Paragraph(vYabanciKimlik)], verticalAlign: VerticalAlign.CENTER, margins: { top: 100, bottom: 100, left: 100 } }),
                                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Pasaport No", bold: true })] })], verticalAlign: VerticalAlign.CENTER, margins: { top: 100, bottom: 100, left: 100 } }),
                                        new TableCell({ children: [new Paragraph(vPasaportNo)], verticalAlign: VerticalAlign.CENTER, margins: { top: 100, bottom: 100, left: 100 } }),
                                    ]
                                }),
                                // Row 4
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Adı", bold: true })] })], verticalAlign: VerticalAlign.CENTER, margins: { top: 100, bottom: 100, left: 100 } }),
                                        new TableCell({ children: [new Paragraph(vAdi)], verticalAlign: VerticalAlign.CENTER, margins: { top: 100, bottom: 100, left: 100 } }),
                                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Soyadı", bold: true })] })], verticalAlign: VerticalAlign.CENTER, margins: { top: 100, bottom: 100, left: 100 } }),
                                        new TableCell({ children: [new Paragraph(vSoyadi)], verticalAlign: VerticalAlign.CENTER, margins: { top: 100, bottom: 100, left: 100 } }),
                                    ]
                                }),
                                // Row 5
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Uyruğu", bold: true })] })], verticalAlign: VerticalAlign.CENTER, margins: { top: 100, bottom: 100, left: 100 } }),
                                        new TableCell({ children: [new Paragraph(vUyrugu)], verticalAlign: VerticalAlign.CENTER, margins: { top: 100, bottom: 100, left: 100 } }),
                                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Doğum Tarihi", bold: true })] })], verticalAlign: VerticalAlign.CENTER, margins: { top: 100, bottom: 100, left: 100 } }),
                                        new TableCell({ children: [new Paragraph(vDogum)], verticalAlign: VerticalAlign.CENTER, margins: { top: 100, bottom: 100, left: 100 } }),
                                    ]
                                }),
                                // Row 6
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph(" ")], shading: { fill: "F2F2F2" } }),
                                        new TableCell({ children: [new Paragraph("Adres")], verticalAlign: VerticalAlign.CENTER, margins: { top: 100, bottom: 100, left: 100 } }),
                                        new TableCell({ children: [new Paragraph("Tel No")], verticalAlign: VerticalAlign.CENTER, margins: { top: 100, bottom: 100, left: 100 } }),
                                        new TableCell({ children: [new Paragraph("Mail")], verticalAlign: VerticalAlign.CENTER, margins: { top: 100, bottom: 100, left: 100 } }),
                                    ]
                                }),
                                // Row 7
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Öğrencinin İletişim Bilgisi", bold: true })] })], verticalAlign: VerticalAlign.CENTER, margins: { top: 100, bottom: 100, left: 100 } }),
                                        new TableCell({ children: [new Paragraph(vAdres)], verticalAlign: VerticalAlign.CENTER, margins: { top: 100, bottom: 100, left: 100 } }),
                                        new TableCell({ children: [new Paragraph(vTel)], verticalAlign: VerticalAlign.CENTER, margins: { top: 100, bottom: 100, left: 100 } }),
                                        new TableCell({ children: [new Paragraph(vMail)], verticalAlign: VerticalAlign.CENTER, margins: { top: 100, bottom: 100, left: 100 } }),
                                    ]
                                })
                            ]
                        }),

                        // Legal Paragraph
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "6458 sayılı Kanunun 38. maddesi çerçevesinde istenilen aşağıdaki belgelerin ekte sunulduğuna dair işbu tebliğ tebellüğ belgesi düzenlenerek altı imza altına alınmış, tebliğ belgesinin bir sureti tarafınıza verilmiş olup, bir sureti il göç idaresi müdürlüğüne gönderilecektir.",
                                    size: 20 // 10pt
                                })
                            ],
                            spacing: { before: 400, after: 200 },
                            alignment: AlignmentType.JUSTIFIED
                        }),

                        // Date Line
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "___ / __ / 2026    (Tarih)",
                                    size: 20
                                })
                            ],
                            spacing: { after: 400 },
                            alignment: AlignmentType.RIGHT
                        }),

                        // Documents List
                        new Paragraph({
                            children: [new TextRun({ text: "BELGELER:", bold: true })],
                            spacing: { after: 200 }
                        }),

                        ...[
                            "İkamet izni kayıt/başvuru formu (öğrenci tarafından ıslak imzalı şekilde)",
                            "Pasaport ya da pasaport yerine geçen belge (aslı görüldü şeklinde)",
                            "Öğrencilik durumunu gösterir belge",
                            "4 adet biometrik fotoğraf",
                            "Geçerli sağlık sigortası (GSS ya da ikamet izni talep süresini kapsayan özel sağlık sigortası)",
                            "Kalacağı adres bilgilerini gösterir belge",
                            "Kendi evinde kalıyorsa, tapu fotokopisi (uzatma başvurularında 'yerleşim yeri belgesi ve fatura' yeterlidir)",
                            "Kira sözleşmesi ile kalıyorsa, kira sözleşmesinin noter onaylı örneği",
                            "Otel vb. konaklama yerlerinde kalınıyorsa, bu yerlerde kalındığına dair belge",
                            "Öğrenci yurtlarında kalınıyorsa, yurtta kalındığına dair belge",
                            "Destekleyici yanında kalınıyorsa, yanında kaldığı kişinin noter onaylı taahhüdü (Destekleyici evli ise ayrıca eşinin de noter onaylı taahhüdü)",
                            "İkamet izni belge bedelinin ödendiği dair makbuz",
                            "18 yaşından küçük yabancılar için; vize muafiyetiyle ya da farklı amaca yönelik vizeyle gelenler için; veli/vasi bilgisini içeren belge ve veli/vasi/yasal temsilcisi tarafından verilen muvafakatname"
                        ].map(text => new Paragraph({
                            text: "☐ " + text, // Using ballot box symbol for checkbox
                            spacing: { after: 120 }
                        })),

                        // Signature Area
                        new Paragraph({
                            children: [
                                new TextRun({ text: "TEBLİĞ EDEN\t\t\t\t\t\tTEBELLÜĞ EDEN", bold: true })
                            ],
                            spacing: { before: 600, after: 200 }
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({ text: "Üniversite Personeli\t\t\t\t\t\tYabancı Öğrenci" })
                            ]
                        })
                    ]
                }]
            });

            try {
                const blob = await Packer.toBlob(doc);
                // Handle missing names for filename gracefully
                const fName = vAdi.trim() ? vAdi.trim() : "Ad";
                const fSurname = vSoyadi.trim() ? vSoyadi.trim() : "Soyad";
                saveAs(blob, `ONBILGI_${fSurname}_${fName}.docx`);
                showToast('Word belgesi başarıyla oluşturuldu.', 'success');
            } catch (err) {
                console.error(err);
                showToast('Word belgesi oluşturulurken bir hata oluştu.', 'error');
            }
        });
    }
});
