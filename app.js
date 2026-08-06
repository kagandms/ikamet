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
        pasaportNo: document.getElementById('field-pasaport-no'),
        adi: document.getElementById('field-adi'),
        soyadi: document.getElementById('field-soyadi'),
        uyrugu: document.getElementById('field-uyrugu'),
        dogumTarihi: document.getElementById('field-dogum-tarihi'),
        adres: document.getElementById('field-adres'),
        tel: document.getElementById('field-tel')
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

    let cropperInstance = null;
    const cropperModal = document.getElementById('cropper-modal');
    const cropperImage = document.getElementById('cropper-image');
    let currentImageObj = null;

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
                
                // OCR başlatmak yerine Kırpma Modalını göster
                currentImageObj = img;
                if (cropperImage && cropperModal) {
                    cropperImage.src = img.src;
                    cropperModal.style.display = 'flex';
                    
                    if (cropperInstance) {
                        cropperInstance.destroy();
                    }
                    
                    cropperInstance = new Cropper(cropperImage, {
                        viewMode: 1,
                        dragMode: 'move',
                        autoCropArea: 0.9,
                        restore: false,
                        guides: true,
                        center: true,
                        highlight: false,
                        cropBoxMovable: true,
                        cropBoxResizable: true,
                        toggleDragModeOnDblclick: false,
                    });
                } else {
                    // Modal yoksa fallback olarak direk OCR başlat (beklenmeyen durum)
                    processAndRunOCR(img);
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // Modal Buton Dinleyicileri
    document.getElementById('btn-crop-cancel')?.addEventListener('click', () => {
        if (cropperModal) cropperModal.style.display = 'none';
        if (cropperInstance) {
            cropperInstance.destroy();
            cropperInstance = null;
        }
        if (previewImage) previewImage.style.display = 'none';
        fileInput.value = "";
        if (fileInputPage2) fileInputPage2.value = "";
    });

    document.getElementById('btn-crop-skip')?.addEventListener('click', () => {
        if (cropperModal) cropperModal.style.display = 'none';
        if (cropperInstance) {
            cropperInstance.destroy();
            cropperInstance = null;
        }
        if (currentImageObj) {
            processAndRunOCR(currentImageObj);
        }
    });

    document.getElementById('btn-crop-confirm')?.addEventListener('click', () => {
        if (!cropperInstance) return;
        
        const croppedCanvas = cropperInstance.getCroppedCanvas();
        if (!croppedCanvas) {
            document.getElementById('btn-crop-skip')?.click();
            return;
        }
        
        if (cropperModal) cropperModal.style.display = 'none';
        cropperInstance.destroy();
        cropperInstance = null;
        
        const croppedImg = new Image();
        croppedImg.onload = () => {
            processAndRunOCR(croppedImg);
        };
        croppedImg.src = croppedCanvas.toDataURL('image/jpeg', 0.95);
    });

    // --- Image Pre-processing ---
    function processAndRunOCR(img) {
        setActiveStep(2);
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Resize if width > 3000px
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 3000;
        
        if (width > MAX_WIDTH) {
            const ratio = MAX_WIDTH / width;
            width = MAX_WIDTH;
            height = height * ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw image
        ctx.drawImage(img, 0, 0, width, height);
        
        // --- Image Pre-processing ---
        // Sadece basit gri tonlama yapıyoruz. Agresif kontrast filtreleri gölgeli 
        // fotoğraflarda metni yok ettiği için iptal edildi. (Tesseract kendi Otsu'sunu kullansın)
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Basit Grayscale
            const gray = (r * 0.299) + (g * 0.587) + (b * 0.114);
            
            data[i] = gray;     // R
            data[i + 1] = gray; // G
            data[i + 2] = gray; // B
        }
        ctx.putImageData(imageData, 0, 0);
        
        // Start OCR
        runOCR(canvas.toDataURL('image/jpeg', 0.95), canvas);
    }

    // --- OCR Processing ---
    async function runOCR(imageDataUrl, sourceCanvas) {
        try {
            if (progressBar) progressBar.style.width = '0%';
            if (progressText) progressText.innerText = 'OCR başlatılıyor...';

            // Wait a moment for UI to update
            await new Promise(resolve => setTimeout(resolve, 100));

            // === 0. PADDLE OCR SUNUCUSU DENEMESİ ===
            try {
                if (progressText) progressText.innerText = 'Sunucuya bağlanılıyor (PaddleOCR)...';
                
                const formData = new FormData();
                formData.append('image', file);
                
                // 30 saniyelik zaman aşımı (telefon fotoları büyük olabilir)
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000);
                
                const response = await fetch('/api/ocr', {
                    method: 'POST',
                    body: formData,
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        const serverText = data.text;
                        const serverWords = data.words;
                        
                        if (progressBar) progressBar.style.width = '90%';
                        if (progressText) progressText.innerText = 'Veriler çözümleniyor...';
                        
                        const rawTextEl = document.getElementById('ocr-raw-text');
                        if (rawTextEl) rawTextEl.textContent = serverText;
                        
                        if (typeof isProcessingPage2 !== 'undefined' && isProcessingPage2) {
                            console.log('[OCR] 2. Sayfa Koordinat bazlı extraction (PaddleOCR)...');
                            extractPage2FromCoordinates(serverWords);
                            
                            if (progressText) progressText.innerText = 'İşlem tamamlandı!';
                            showToast('2. Sayfa bilgileri çıkarıldı (PaddleOCR).', 'success');
                            setActiveStep(3);
                            isProcessingPage2 = false;
                            return;
                        }
                        
                        const serverExtracted = extractFields(serverText);
                        if (!serverExtracted.uyrugu) {
                            extractFromCoordinates(serverWords, serverExtracted);
                        }
                        
                        populateForm(serverExtracted);
                        if (progressText) progressText.innerText = 'İşlem tamamlandı!';
                        showToast('OCR işlemi başarıyla tamamlandı (PaddleOCR).', 'success');
                        setActiveStep(3);
                        return; // PaddleOCR başarılı olduysa fonksiyonu burada bitir, Tesseract'e geçme
                    }
                }
            } catch (err) {
                console.warn('PaddleOCR sunucusuna bağlanılamadı. Tesseract.js kullanılıyor...', err);
                showToast('Python sunucusu kapalı, yerel OCR (Tesseract) kullanılıyor...', 'warning');
            }

            if (progressText) progressText.innerText = 'Yerel OCR başlatılıyor...';

            const worker = await Tesseract.createWorker('tur', 1, {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        const p = Math.round(m.progress * 100);
                        if (progressBar) progressBar.style.width = p + '%';
                        if (progressText) progressText.innerText = 'Okunuyor... %' + p;
                    }
                }
            });

            // === PASS 1: PSM 6 (mevcut — başvuru no, pasaport no vs. için) ===
            await worker.setParameters({
                tessedit_pageseg_mode: '6'
            });

            const result = await worker.recognize(imageDataUrl);

            const text = result.data.text;
            const words = result.data.words || [];
            let allPassWords = [...words];
            
            // Log raw text for debugging
            const rawTextEl = document.getElementById('ocr-raw-text');
            if (rawTextEl) rawTextEl.textContent = text;
            
            // === 2. SAYFA (PAGE 2) İÇİN ERKEN ÇIKIŞ ===
            if (typeof isProcessingPage2 !== 'undefined' && isProcessingPage2) {
                console.log('[OCR] 2. Sayfa Koordinat bazlı extraction başlatılıyor...');
                extractPage2FromCoordinates(words);
                
                await worker.terminate();
                if (progressText) progressText.innerText = 'İşlem tamamlandı!';
                showToast('2. Sayfa bilgileri çıkarıldı.', 'success');
                setActiveStep(3);
                isProcessingPage2 = false;
                return;
            }
            
            // Text-based extraction (mevcut mantık — başvuru no, pasaport no, vb.)
            const extracted = extractFields(text);
            
            // Koordinat bazlı fallback: uyruk boşsa words array'den dene
            if (!extracted.uyrugu) {
                console.log('[OCR] Pass 1 koordinat bazlı extraction deneniyor...');
                extractFromCoordinates(words, extracted);
            }
            
            // === PASS 2: Hâlâ boş alanlar varsa, PSM 4 ile tekrar tara ===
            if (!extracted.uyrugu || !extracted.dogumTarihi) {
                console.log('[OCR] Pass 2 başlatılıyor (PSM 4)...');
                if (progressText) progressText.innerText = 'Eksik alanlar tekrar taranıyor...';
                
                await worker.setParameters({
                    tessedit_pageseg_mode: '4'
                });
                
                const result2 = await worker.recognize(imageDataUrl);
                const text2 = result2.data.text;
                const words2 = result2.data.words || [];
                
                console.log('[OCR] Pass 2 (PSM 4) ham metin:', text2);
                
                // Pass 2 text-based extraction (sadece boş alanlar için)
                const extracted2 = extractFields(text2);
                if (!extracted.uyrugu && extracted2.uyrugu) extracted.uyrugu = extracted2.uyrugu;
                if (!extracted.dogumTarihi && extracted2.dogumTarihi) extracted.dogumTarihi = extracted2.dogumTarihi;
                allPassWords.push(...words2);
                
                // Pass 2 koordinat bazlı extraction (hâlâ boşlar için)
                if (!extracted.uyrugu) {
                    extractFromCoordinates(words2, extracted);
                }
                
                // === PASS 3: Son çare — PSM 11 (sparse text) ===
                if (!extracted.uyrugu) {
                    console.log('[OCR] Pass 3 başlatılıyor (PSM 11 - sparse)...');
                    if (progressText) progressText.innerText = 'Detaylı tarama yapılıyor...';
                    
                    await worker.setParameters({
                        tessedit_pageseg_mode: '11'
                    });
                    
                    const result3 = await worker.recognize(imageDataUrl);
                    const text3 = result3.data.text;
                    const words3 = result3.data.words || [];
                    
                    console.log('[OCR] Pass 3 (PSM 11) ham metin:', text3);
                    
                    const extracted3 = extractFields(text3);
                    if (!extracted.uyrugu && extracted3.uyrugu) extracted.uyrugu = extracted3.uyrugu;
                    if (!extracted.dogumTarihi && extracted3.dogumTarihi) extracted.dogumTarihi = extracted3.dogumTarihi;
                    
                    if (!extracted.uyrugu) {
                        extractFromCoordinates(words3, extracted);
                    }
                    allPassWords.push(...words3);
                }
            }
            
            // === UYRUĞU: HÜCRE CROP + PSM 7 RE-OCR ===
            if (!extracted.uyrugu && sourceCanvas) {
                console.log('[OCR] Uyruğu için hücre crop + PSM 7 deneniyor...');
                if (progressText) progressText.innerText = 'Uyruğu alanı taranıyor...';
                
                // allPassWords içinden uygun etiketi bul
                let labelBbox = null;
                
                // Önce standalone "Nationality" ara ("in Born" olmayanı)
                for (const w of allPassWords) {
                    if (!/^Nationality$/i.test(w.text)) continue;
                    const wCenterY = (w.bbox.y0 + w.bbox.y1) / 2;
                    const wHeight = w.bbox.y1 - w.bbox.y0;
                    const hasIn = allPassWords.some(other => 
                        /^in$/i.test(other.text) && 
                        Math.abs(((other.bbox.y0 + other.bbox.y1) / 2) - wCenterY) < wHeight * 0.6 &&
                        other.bbox.x0 > w.bbox.x1
                    );
                    if (!hasIn) {
                        labelBbox = w.bbox;
                        console.log('[Crop] "Nationality" etiketi bulundu:', labelBbox);
                        break;
                    }
                }
                
                // Bulamadıysa standalone "Uyruğu" ara
                if (!labelBbox) {
                    for (const w of allPassWords) {
                        if (!/^Uyru[gğ]u$/i.test(w.text)) continue;
                        const wCenterY = (w.bbox.y0 + w.bbox.y1) / 2;
                        const wHeight = w.bbox.y1 - w.bbox.y0;
                        const hasDiger = allPassWords.some(other => 
                            /^(Di[gğ]er|Do[gğ]um)/i.test(other.text) && 
                            Math.abs(((other.bbox.y0 + other.bbox.y1) / 2) - wCenterY) < wHeight * 0.6
                        );
                        if (!hasDiger) {
                            labelBbox = w.bbox;
                            console.log('[Crop] "Uyruğu" etiketi bulundu:', labelBbox);
                            break;
                        }
                    }
                }
                
                if (labelBbox) {
                    const canvasW = sourceCanvas.width;
                    const labelH = labelBbox.y1 - labelBbox.y0;
                    const padding = labelH * 0.8;
                    
                    // Crop bölgesi: etiketin sağından, resmin %90'ına kadar
                    const cropX = Math.max(0, labelBbox.x1 + 2);
                    const cropY = Math.max(0, labelBbox.y0 - padding);
                    const cropW = Math.min(canvasW * 0.45, canvasW - cropX);
                    const cropH = labelH + padding * 2;
                    
                    if (cropW > 10 && cropH > 5) {
                        const cropCanvas = document.createElement('canvas');
                        cropCanvas.width = cropW;
                        cropCanvas.height = cropH;
                        const cropCtx = cropCanvas.getContext('2d');
                        cropCtx.drawImage(sourceCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
                        
                        // PSM 7: Tek satır metin olarak tara
                        await worker.setParameters({ tessedit_pageseg_mode: '7' });
                        const cropResult = await worker.recognize(cropCanvas.toDataURL('image/jpeg', 0.95));
                        const cropText = cropResult.data.text.trim();
                        
                        console.log('[Crop] Uyruğu crop OCR sonucu:', cropText);
                        
                        // Sadece harflerden oluşan, 3+ karakter uzunluğundaki metni al
                        const cleanedCountry = cropText.replace(/[^A-ZÇĞİÖŞÜa-zçğıöşü\s]/g, '').trim();
                        if (cleanedCountry.length >= 3) {
                            extracted.uyrugu = cleanedCountry.toUpperCase();
                            console.log('[Crop] Uyruğu bulundu:', extracted.uyrugu);
                        }
                        
                        // PSM 7 başarısız olduysa PSM 8 (single word) dene
                        if (!extracted.uyrugu) {
                            await worker.setParameters({ tessedit_pageseg_mode: '8' });
                            const cropResult2 = await worker.recognize(cropCanvas.toDataURL('image/jpeg', 0.95));
                            const cropText2 = cropResult2.data.text.trim();
                            
                            console.log('[Crop] Uyruğu crop OCR (PSM 8) sonucu:', cropText2);
                            
                            const cleaned2 = cropText2.replace(/[^A-ZÇĞİÖŞÜa-zçğıöşü\s]/g, '').trim();
                            if (cleaned2.length >= 3) {
                                extracted.uyrugu = cleaned2.toUpperCase();
                                console.log('[Crop] Uyruğu (PSM 8) bulundu:', extracted.uyrugu);
                            }
                        }
                    }
                } else {
                    console.log('[Crop] Uyruğu/Nationality etiketi koordinatlarda bulunamadı.');
                }
            }
            
            await worker.terminate();
            
            populateForm(extracted);
            
            if (progressText) progressText.innerText = 'İşlem tamamlandı!';
            showToast('OCR işlemi başarıyla tamamlandı.', 'success');
            setActiveStep(3);

        } catch (error) {
            console.error("OCR Error:", error);
            showToast('OCR işlemi başarısız. Lütfen daha net bir fotoğraf yükleyin.', 'error');
            setActiveStep(1);
        }
    }

    // --- Field Extraction ---
    // === 2. SAYFA KOORDİNAT BAZLI EXTRACTION ===
    function extractPage2FromCoordinates(words) {
        if (!words || words.length === 0) return;
        
        const sameRow = (w1, w2) => {
            const h1 = w1.bbox.y1 - w1.bbox.y0;
            const h2 = w2.bbox.y1 - w2.bbox.y0;
            const tolerance = Math.max(h1, h2) * 0.6;
            const center1 = (w1.bbox.y0 + w1.bbox.y1) / 2;
            const center2 = (w2.bbox.y0 + w2.bbox.y1) / 2;
            return Math.abs(center1 - center2) < tolerance;
        };

        // Adım 1: Sınırları belirle (Min Y ve Max Y)
        let minY = 0;
        let maxY = 999999;
        
        for (const w of words) {
            // "KALACAĞI" kelimesi hedef bölümün başlığındadır
            if (/KALACA[GĞ]I/i.test(w.text) && w.bbox.y0 > minY) {
                minY = w.bbox.y1;
                console.log('[Page2] Min Y sınırı bulundu (KALACAĞI):', minY);
            }
            // "ÖĞRENİM" kelimesi sonraki bölümün başlığındadır
            else if (/[OÖ][GĞ]REN[Iİ]M/i.test(w.text) && w.bbox.y0 > minY) {
                maxY = w.bbox.y0;
                console.log('[Page2] Max Y sınırı bulundu (ÖĞRENİM):', maxY);
                break;
            }
        }

        console.log(`[Page2] Arama bölgesi: Y:${minY} - Y:${maxY}`);

        // Bu bölgedeki kelimeler
        const sectionWords = words.filter(w => w.bbox.y0 >= minY && w.bbox.y1 <= maxY);
        const imageWidth = Math.max(...words.map(w => w.bbox.x1), 1);
        const midpoint = imageWidth * 0.50;
        
        let foundAdres = '';
        let foundTel = '';

        // --- ADRES (Çoklu satır desteği) ---
        let adresLabelY = -1;
        let nextLabelY = maxY; // default to end of section
        
        for (const w of sectionWords) {
            if (/^Adres|Address$/i.test(w.text)) {
                if (adresLabelY === -1 || w.bbox.y0 < adresLabelY) {
                    adresLabelY = w.bbox.y0;
                }
            } else if (adresLabelY !== -1 && /^Ta[sŞş][iıI]nma|Moving$/i.test(w.text) && w.bbox.y0 > adresLabelY) {
                if (w.bbox.y0 < nextLabelY) nextLabelY = w.bbox.y0;
            }
        }

        if (adresLabelY !== -1) {
            const adresWords = sectionWords.filter(w => 
                w.bbox.y0 >= adresLabelY - 5 && 
                w.bbox.y1 <= nextLabelY + 5 &&
                w.bbox.x0 < midpoint &&
                w.bbox.x0 > imageWidth * 0.22 // Sadece değer sütununu al (sol sütundaki etiket artıkları "Ba" vs elenir)
            ).sort((a, b) => {
                if (Math.abs(a.bbox.y0 - b.bbox.y0) > 15) return a.bbox.y0 - b.bbox.y0;
                return a.bbox.x0 - b.bbox.x0;
            });
            
            if (adresWords.length > 0) {
                foundAdres = adresWords.map(aw => aw.text).join(' ').trim();
                // Adresin başındaki "Ba", "İSTANBUL", "," gibi OCR kalıntılarını agresif temizle
                let cleanAdres = foundAdres.replace(/^(?:Ba\s*)?(?:[Iİ]STANBUL\s*)?[\s,]*/i, '').trim();
                // En başa her zaman sabit "İSTANBUL, " ekle
                foundAdres = "İSTANBUL, " + cleanAdres;
                console.log('[Page2] Adres bulundu:', foundAdres);
            }
        }

        // --- TELEFON 1 ---
        // Telefon hücrelerinde Y hizası ("Telefon 1" vs "Phone 1") OCR'ı yanıltabilir. 
        // Bu yüzden bölümün sağ tarafındaki (midpoint'ten büyük) 10 haneli tek numarayı arıyoruz.
        for (const w of sectionWords) {
            if (w.bbox.x0 > midpoint) {
                const digits = w.text.replace(/\D/g, '');
                if (digits.length >= 10) {
                    const last10 = digits.slice(-10);
                    // Başka alan (örn: T.C. kimlik) araya karışmasın diye 5 ile başlıyorsa al (veya standart 10 hane)
                    if (last10.startsWith('5')) {
                        foundTel = `0${last10.slice(0,3)} ${last10.slice(3,6)} ${last10.slice(6,8)} ${last10.slice(8,10)}`;
                        console.log('[Page2] Telefon bulundu (sağ sütun rakam taraması):', foundTel);
                        break;
                    }
                }
            }
        }

        if (foundAdres) {
            const adresField = document.getElementById('field-adres');
            if (adresField) {
                adresField.value = foundAdres.substring(0, 100);
                adresField.classList.add('field-filled');
            }
        }

        if (foundTel) {
            const telField = document.getElementById('field-tel');
            if (telField) {
                telField.value = foundTel;
                telField.classList.add('field-filled');
            }
        }
    }

    // === KOORDİNAT BAZLI EXTRACTION (1. Sayfa Tablo hücreleri için) ===
    function extractFromCoordinates(words, extracted) {
        if (!words || words.length === 0) return;
        
        // Yardımcı: iki kelime aynı hücrede/satırda mı? (Y koordinatı asimetrik toleransla)
        const sameRow = (label, word) => {
            const labelH = label.bbox.y1 - label.bbox.y0;
            const labelCenter = (label.bbox.y0 + label.bbox.y1) / 2;
            const wordCenter = (word.bbox.y0 + word.bbox.y1) / 2;
            
            const diff = wordCenter - labelCenter;
            
            // Hücre mantığı: Etiketin merkezi ile kelimenin merkezi arasındaki fark.
            // Hücre yüksekliğini kapsayacak şekilde simetrik ve güvenli bir tolerans artırıldı (2.5)
            return Math.abs(diff) <= labelH * 2.5;
        };
        
        // Form etiketleri — bunları değer olarak almayacağız (OCR hataları dahil)
        // Form etiketlerini OCR hatalarıyla birlikte tanıma listesi
        const coordFormLabels = /^(di[gğ]er|other|citizenship|uyr[uü][gğ]?[uü]?[a-z]*|nationality|nationali|nation|[dt][oö][gğ][uü]m[a-z]*|born|birth|[öo]nceki|previous|surname|surmame|surnane|sumame|name|nane|mame|father|mother|baba|anne|cinsiyet|gender|medeni|marital|uets|yeri|[üu]lkesi|country|kimlik|id|no|foreigner|place|foreign|date|tarihi|hali|status|biyo(?:metrik)?|number|document|belge|kay[ıi]t|registration|[iİ]kamet|ba[sş]vuru|randevu|talep|seyahat|travel|information|type|t[üu]r[üu]|foto[gğ]raf|numara|soyad[ıi]?|ad[ıi]?|ki[sş]i|personal|bilgi|in|of|for|the|that)$/i;
        
        // Resmin tahmini genişliği (words'den hesapla)
        const imageWidth = Math.max(...words.map(w => w.bbox.x1), 1);
        // Sol sütun değerleri kabaca ilk %50'de olur
        const midpoint = imageWidth * 0.50;
        
        // OCR hatalarına karşı daha esnek kontrol (grabName mantığı ile aynı)
        const cleanAndFixWord = (text) => {
            const cleanedWord = text.replace(/[^A-ZÇĞİÖŞÜa-zçğıöşü'\-]/g, '');
            if (cleanedWord.length < 2) return null;
            return text.toUpperCase()
                .replace(/[0]/g, 'O').replace(/[1]/g, 'I').replace(/[3]/g, 'E')
                .replace(/[4]/g, 'A').replace(/[5]/g, 'S').replace(/[8]/g, 'B')
                .replace(/[^A-ZÇĞİÖŞÜ'\-]/g, '');
        };

        // Yardımcı: etiket kelimesinin sağında, aynı satırda, midpoint'ten önce olan değer kelimeleri bul
        const findValueWordsForLabel = (labelWord) => {
            const validWords = words
                .filter(w => {
                    if (!sameRow(labelWord, w)) return false;
                    if (w.bbox.x0 <= labelWord.bbox.x1) return false;
                    // Resim kaymış/dar açılıysa midpoint sağa kayabilir. Tolerans 0.65'e çıkarıldı. (Sağ sütunu coordFormLabels engelliyor zaten)
                    if (w.bbox.x0 > imageWidth * 0.65) return false;
                    if (coordFormLabels.test(w.text)) return false;
                    
                    // OCR Halüsinasyon filtresi (Tekrar devrede, lekeleri engeller)
                    const labelH = labelWord.bbox.y1 - labelWord.bbox.y0;
                    const wH = w.bbox.y1 - w.bbox.y0;
                    if (wH > labelH * 2.8 || wH < labelH * 0.3) return false;
                    
                    return cleanAndFixWord(w.text) !== null;
                })
                .sort((a, b) => a.bbox.x0 - b.bbox.x0)
                .map(w => cleanAndFixWord(w.text));
            return validWords.slice(0, 3); // En fazla 3 kelime al (isimler genelde 1-3 kelimedir)
        };
        
        // Yardımcı: sağ sütun değerleri bul (Uyruğu gibi - midpoint sonrası)
        const findRightColumnValues = (labelWord) => {
            const validWords = words
                .filter(w => {
                    if (!sameRow(labelWord, w)) return false;
                    if (w.bbox.x0 <= labelWord.bbox.x1) return false;
                    if (coordFormLabels.test(w.text)) return false;
                    
                    const labelH = labelWord.bbox.y1 - labelWord.bbox.y0;
                    const wH = w.bbox.y1 - w.bbox.y0;
                    if (wH > labelH * 2.8 || wH < labelH * 0.3) return false;
                    
                    return cleanAndFixWord(w.text) !== null;
                })
                .sort((a, b) => a.bbox.x0 - b.bbox.x0)
                .map(w => cleanAndFixWord(w.text));
            return validWords.slice(0, 3);
        };
        
        // --- ADI VE SOYADI ---
        if (!extracted.soyadi) {
            for (const w of words) {
                if (!/Soyad[iı]?/i.test(w.text) && !/Surname/i.test(w.text)) continue;
                const values = findValueWordsForLabel(w);
                if (values.length > 0) {
                    extracted.soyadi = values.join(' ');
                    console.log('[Koordinat] Soyadı bulundu:', extracted.soyadi);
                    break;
                }
            }
        }
        
        if (!extracted.adi) {
            for (const w of words) {
                if (!/Ad[iı]?/i.test(w.text) && !/Name/i.test(w.text)) continue;
                const values = findValueWordsForLabel(w);
                if (values.length > 0) {
                    extracted.adi = values.join(' ');
                    console.log('[Koordinat] Adı bulundu:', extracted.adi);
                    break;
                }
            }
        }
        // --- UYRUĞU ---
        if (!extracted.uyrugu) {
            for (const w of words) {
                if (!/^Uyru[gğ]u$/i.test(w.text)) continue;
                // "Diğer Uyruğu" ve "Doğumdaki Uyruğu" satırlarını atla
                const hasDiger = words.some(other => 
                    /^(Di[gğ]er|Do[gğ]um)/i.test(other.text) && sameRow(w, other)
                );
                if (hasDiger) continue;
                
                // Uyruğu sağ sütunda — midpoint kısıtlaması yok
                const values = findRightColumnValues(w);
                if (values.length > 0) {
                    extracted.uyrugu = values.join(' ');
                    console.log('[Koordinat] Uyruğu bulundu:', extracted.uyrugu);
                    break;
                }
            }
            
            // Fallback: "Nationality" etiketinden de dene
            if (!extracted.uyrugu) {
                for (const w of words) {
                    if (!/^Nationality$/i.test(w.text)) continue;
                    // "Nationality in Born" satırını atla
                    const hasIn = words.some(other => 
                        /^in$/i.test(other.text) && sameRow(w, other) && other.bbox.x0 > w.bbox.x1
                    );
                    if (hasIn) continue;
                    
                    const values = findRightColumnValues(w);
                    if (values.length > 0) {
                        extracted.uyrugu = values.join(' ');
                        console.log('[Koordinat] Uyruğu (Nationality) bulundu:', extracted.uyrugu);
                        break;
                    }
                }
            }
        }

        // --- DOĞUM TARİHİ ---
        if (!extracted.dogumTarihi) {
            for (const w of words) {
                if (!/(Do[gğ]um|Birth)/i.test(w.text)) continue;
                
                // Sağ sütunda olduğundan emin olalım (Kayıt Tarihi solda karışmasın, esneklik için 0.30)
                if (w.bbox.x0 < imageWidth * 0.30) continue;

                // Kelimenin sağında, aynı hizada olan kelimeleri topla
                const dateWords = words.filter(other => 
                    sameRow(w, other) && 
                    other.bbox.x0 > w.bbox.x1
                ).sort((a, b) => a.bbox.x0 - b.bbox.x0);
                
                const dateStr = dateWords.map(dw => dw.text).join(' ');
                // OCR hatalarını düzelt (S->5, O->0, l/I->1, Z->2)
                const cleanDate = dateStr.replace(/[OoQq]/g, '0').replace(/[Ss\$]/g, '5').replace(/[lI|]/g, '1').replace(/[Zz]/g, '2');
                
                const match = cleanDate.match(/(3[01]|[12]\d|0?[1-9])\s*[/.\-\s]+\s*(1[0-2]|0?[1-9])\s*[/.\-\s]+\s*(\d{4})/);
                if (match) {
                    extracted.dogumTarihi = `${match[1].padStart(2, '0')}.${match[2].padStart(2, '0')}.${match[3]}`;
                    console.log('[Koordinat] Doğum Tarihi bulundu:', extracted.dogumTarihi);
                    break;
                }
            }
        }
    }

    function extractFields(text) {
        // Normalize newlines for easier regex matching
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        const fullText = lines.join('\n');
        
        const extracted = {
            basvuruNo: '', pasaportNo: '', adi: '', soyadi: '', uyrugu: '', dogumTarihi: ''
        };

        // Known form label words — stops name extraction at right-column labels (OCR hataları dahil)
        const formLabels = /^(di[gğ]er|other|citizenship|uyr[uü][gğ]?[uü]?[a-z]*|nationality|nationali|nation|[dt][oö][gğ][uü]m[a-z]*|born|birth|[öo]nceki|previous|surname|surmame|surnane|sumame|name|nane|mame|father|mother|baba|anne|cinsiyet|gender|medeni|marital|uets|yeri|[üu]lkesi|country|kimlik|id|no|foreigner|place|foreign|date|tarihi|hali|status|biyo(?:metrik)?|number|document|belge|kay[ıi]t|registration|[iİ]kamet|ba[sş]vuru|randevu|talep|seyahat|travel|information|type|t[üu]r[üu]|foto[gğ]raf|numara|soyad[ıi]?|ad[ıi])$/i;

        // Helper: grab consecutive name words, stopping at form labels.
        // Tolerates 1 lowercase OCR error per word.
        const grabName = (str) => {
            const words = str.split(/[\s,;:]+/).filter(w => w.length > 0);
            const result = [];
            for (const word of words) {
                if (result.length >= 4) break;
                if (formLabels.test(word)) break;
                
                // OCR hatalarına karşı daha esnek kontrol: Kelime içindeki harf dışı karakterleri temizle
                const cleanedWord = word.replace(/[^A-ZÇĞİÖŞÜa-zçğıöşü'\-]/g, '');
                const isNameWord = cleanedWord.length >= 2;
                
                if (isNameWord) {
                    // OCR'da sık karışan rakamları harfe çevir
                    let fixedWord = word.toUpperCase()
                        .replace(/[0]/g, 'O')
                        .replace(/[1]/g, 'I')
                        .replace(/[3]/g, 'E')
                        .replace(/[4]/g, 'A')
                        .replace(/[5]/g, 'S')
                        .replace(/[8]/g, 'B')
                        .replace(/[^A-ZÇĞİÖŞÜ'\-]/g, '');
                    
                    if(fixedWord.length >= 2) {
                        result.push(fixedWord);
                    }
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

        // Strategy C: Generic YYYY-NN-NNNNNNN anchored to 20XX or 50XX (OCR error for 2)
        if (!extracted.basvuruNo) {
            const genericMatch = fullText.match(/\b([25Zz]?0\d{2})\s*[-–]\s*(\d{2})\s*[-–]\s*(\d{5,7})\b/);
            if (genericMatch) {
                extracted.basvuruNo = `${genericMatch[1]}-${genericMatch[2]}-${genericMatch[3]}`;
            }
        }

        // OCR digit corrections for başvuru no
        if (extracted.basvuruNo) {
            const parts = extracted.basvuruNo.split('-');
            if (parts.length === 3) {
                parts.forEach((p, idx) => {
                    parts[idx] = p.replace(/[OoQq]/g, '0').replace(/[S\$]/g, '5').replace(/[Zz]/g, '2').replace(/[l]/g, '1');
                });
                // 5 ile başlayan yılları (OCR hatası) 2'ye zorla
                if (parts[0].startsWith('50') || parts[0].startsWith('Z0')) {
                    parts[0] = '20' + parts[0].substring(2);
                }
                extracted.basvuruNo = parts.join('-');
            }
        }

        // ============================================
        // 2. SOYADI VE ADI
        // ============================================

        // Soyadı
        const soyadiRegex = /(?:Soyad[iı]?|Surname)/gi;
        let sM;
        while ((sM = soyadiRegex.exec(fullText)) !== null) {
            const after = fullText.substring(sM.index + sM[0].length, sM.index + sM[0].length + 150);
            const words = after.split(/[\s\/:.-]+/).filter(w => w.length >= 2);
            let validParts = [];
            for (let word of words) {
                if (formLabels.test(word)) {
                    if (validParts.length > 0) break;
                    continue;
                }
                const cleanWord = word.replace(/[^A-ZÇĞİÖŞÜa-zçğıöşü]/g, '');
                if (cleanWord.length < 2) continue;
                
                // Toleransı artır: Kelimenin en az %40'ı büyük harfse kabul et
                const upperCount = (cleanWord.match(/[A-ZÇĞİÖŞÜ]/g) || []).length;
                const isMostlyUppercase = upperCount >= Math.floor(cleanWord.length * 0.4);
                
                if (isMostlyUppercase) {
                    validParts.push(cleanWord.toUpperCase());
                } else {
                    if (validParts.length > 0) break; 
                }
            }
            if (validParts.length > 0 && !extracted.soyadi) {
                extracted.soyadi = validParts.slice(0, 3).join(' ');
                break;
            }
        }

        // Adı
        const adiRegex = /(?:Ad[iı]?|Name)/gi;
        let aM;
        while ((aM = adiRegex.exec(fullText)) !== null) {
            const before = fullText.substring(Math.max(0, aM.index - 15), aM.index);
            // Soyadı, Baba Adı, Anne Adı gibi kelimelerin içindeki "Adı" kelimesini atla
            if (/soy|baba|anne|father|mother|previous|[öo]nceki/i.test(before)) continue; 
            
            const after = fullText.substring(aM.index + aM[0].length, aM.index + aM[0].length + 150);
            const words = after.split(/[\s\/:.-]+/).filter(w => w.length >= 2);
            let validParts = [];
            for (let word of words) {
                if (formLabels.test(word)) {
                    if (validParts.length > 0) break;
                    continue;
                }
                const cleanWord = word.replace(/[^A-ZÇĞİÖŞÜa-zçğıöşü]/g, '');
                if (cleanWord.length < 2) continue;
                
                const upperCount = (cleanWord.match(/[A-ZÇĞİÖŞÜ]/g) || []).length;
                const isMostlyUppercase = upperCount >= Math.floor(cleanWord.length * 0.4);

                if (isMostlyUppercase) {
                    validParts.push(cleanWord.toUpperCase());
                } else {
                    if (validParts.length > 0) break; 
                }
            }
            if (validParts.length > 0 && !extracted.adi) {
                extracted.adi = validParts.slice(0, 3).join(' ');
                break;
            }
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
            
            // Tüm kelimeleri alıp aradaki etiketleri atlıyoruz
            const words = after.split(/[\s\/:.-]+/).filter(w => w.length >= 2);
            let validParts = [];
            for (let word of words) {
                if (formLabels.test(word)) {
                    if (validParts.length > 0) break; // Ülke adından sonra etiket gelirse dur
                    continue; // Başlangıçtaki etiketleri (örn: Foreign, ID, Number) atla
                }
                
                if (/^[A-ZÇĞİÖŞÜa-zçğıöşü]+$/.test(word)) {
                    validParts.push(word.toUpperCase());
                } else if (validParts.length > 0) {
                    break;
                }
                
                if (validParts.length >= 2) break; // En fazla 2 kelimelik ülkeler
            }
            
            if (validParts.length > 0) {
                extracted.uyrugu = validParts.join(' ');
                break;
            }
        }

        // ============================================
        // 5. DOĞUM TARİHİ
        // ============================================
        const dobMatch = fullText.match(
            /(?:Do[gğ]um\s*Tarih[a-zıi]|Date\s*of\s*Birth|Born)[^\d]{0,120}(3[01]|[12]\d|0?[1-9])\s*[/.\-\s]+\s*(1[0-2]|0?[1-9])\s*[/.\-\s]+\s*(\d{4})/i
        );
        if (dobMatch) {
            extracted.dogumTarihi = `${dobMatch[1].padStart(2, '0')}.${dobMatch[2].padStart(2, '0')}.${dobMatch[3]}`;
        }

        // ============================================
        // 6. PASAPORT NO (Belge No)
        // ============================================
        const belgeMatch = fullText.match(
            /(?:Belge\s*N[oO0]|Number\s*of\s*Document)[^\w]{0,10}([A-Z0-9ĞÜŞİÖÇğüşiöç]{5,15})/i
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
            const letterMatch = extracted.pasaportNo.match(/^([A-Za-zĞÜŞİÖÇ]*)/);
            if (letterMatch && letterMatch[0].length < extracted.pasaportNo.length) {
                const lp = letterMatch[0];
                const dp = extracted.pasaportNo.substring(lp.length);
                extracted.pasaportNo = lp + dp.replace(/[Oo]/g, '0').replace(/[Ss]/g, '5').replace(/[Zz]/g, '2').replace(/[l]/g, '1');
            }
        }

        // Garbage Collector: Reject overly long extractions
        if (extracted.adi && extracted.adi.split(' ').length > 4) extracted.adi = '';
        if (extracted.soyadi && extracted.soyadi.split(' ').length > 4) extracted.soyadi = '';

        return extracted;
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
                if (field.tagName === 'SELECT') {
                    // Select elemanı ise, değerin seçenekler arasında olup olmadığını kontrol et
                    const optionExists = Array.from(field.options).some(opt => opt.value === value);
                    if (optionExists) {
                        field.value = value;
                        field.classList.add('success');
                    }
                } else {
                    field.value = value;
                    field.classList.add('success');
                }
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
            const vYabanciKimlik = ' '; // Word tablosunda boş kalması için sabit boşluk gönderiliyor
            const vPasaportNo = getVal(fields.pasaportNo);
            const vAdi = getVal(fields.adi);
            const vSoyadi = getVal(fields.soyadi);
            const vUyrugu = getVal(fields.uyrugu);
            const vDogum = getVal(fields.dogumTarihi);
            const vAdres = getVal(fields.adres);
            const vTel = getVal(fields.tel);
            const vMail = "xxxx"; // Sabit 'xxxx' değeri (kullanıcı talebi)

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
