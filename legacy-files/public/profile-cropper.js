// ===== ADVANCED PROFILE PICTURE CROPPING COMPONENT =====
// Professional image cropping functionality for user profile pictures

class ProfilePictureCropper {
    constructor(options = {}) {
        this.options = {
            maxSize: 2 * 1024 * 1024, // 2MB default
            allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
            outputFormat: 'image/jpeg',
            outputQuality: 0.9,
            cropSize: 300, // Square crop size
            minCropSize: 100,
            modalId: 'cropModal',
            ...options
        };
        
        this.canvas = null;
        this.ctx = null;
        this.image = null;
        this.cropData = {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        };
        this.isDragging = false;
        this.isResizing = false;
        this.resizeHandle = null;
        this.startPos = { x: 0, y: 0 };
        this.originalImageData = null;
        
        this.init();
    }
    
    init() {
        this.createCropperModal();
        this.setupEventListeners();
        console.log('Profile Picture Cropper initialized');
    }
    
    // Create the cropper modal HTML structure
    createCropperModal() {
        const modalHTML = `
            <div id="${this.options.modalId}" class="crop-modal" style="display: none;">
                <div class="crop-modal-overlay"></div>
                <div class="crop-modal-content">
                    <div class="crop-modal-header">
                        <h3><i class="fas fa-crop"></i> Crop Profile Picture</h3>
                        <button class="crop-close-btn" type="button">&times;</button>
                    </div>
                    <div class="crop-modal-body">
                        <div class="crop-controls">
                            <div class="crop-control-group">
                                <label>Zoom:</label>
                                <input type="range" id="zoomSlider" min="0.5" max="3" step="0.1" value="1">
                                <span id="zoomValue">100%</span>
                            </div>
                            <div class="crop-control-group">
                                <label>Rotate:</label>
                                <button class="rotate-btn" data-angle="-90"><i class="fas fa-undo"></i></button>
                                <button class="rotate-btn" data-angle="90"><i class="fas fa-redo"></i></button>
                            </div>
                            <div class="crop-control-group">
                                <label>Filters:</label>
                                <select id="filterSelect">
                                    <option value="none">None</option>
                                    <option value="brightness">Brightness</option>
                                    <option value="contrast">Contrast</option>
                                    <option value="saturation">Saturation</option>
                                    <option value="sepia">Sepia</option>
                                    <option value="grayscale">Grayscale</option>
                                </select>
                            </div>
                        </div>
                        <div class="crop-canvas-container">
                            <canvas id="cropCanvas" class="crop-canvas"></canvas>
                            <div class="crop-overlay">
                                <div class="crop-selection">
                                    <div class="crop-handle crop-handle-nw"></div>
                                    <div class="crop-handle crop-handle-ne"></div>
                                    <div class="crop-handle crop-handle-sw"></div>
                                    <div class="crop-handle crop-handle-se"></div>
                                    <div class="crop-handle crop-handle-n"></div>
                                    <div class="crop-handle crop-handle-s"></div>
                                    <div class="crop-handle crop-handle-w"></div>
                                    <div class="crop-handle crop-handle-e"></div>
                                </div>
                            </div>
                        </div>
                        <div class="crop-preview">
                            <h4>Preview</h4>
                            <canvas id="previewCanvas" width="150" height="150"></canvas>
                        </div>
                    </div>
                    <div class="crop-modal-footer">
                        <button class="crop-btn crop-btn-secondary" id="resetCrop">Reset</button>
                        <button class="crop-btn crop-btn-secondary" id="cancelCrop">Cancel</button>
                        <button class="crop-btn crop-btn-primary" id="applyCrop">Apply Crop</button>
                    </div>
                </div>
            </div>
        `;
        
        // Insert modal into page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Add CSS styles
        this.addCropperStyles();
        
        // Get references to elements
        this.modal = document.getElementById(this.options.modalId);
        this.canvas = document.getElementById('cropCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.previewCanvas = document.getElementById('previewCanvas');
        this.previewCtx = this.previewCanvas.getContext('2d');
        this.cropSelection = document.querySelector('.crop-selection');
        this.cropOverlay = document.querySelector('.crop-overlay');
    }
    
    // Add comprehensive CSS styles for the cropper
    addCropperStyles() {
        const styles = `
            <style id="crop-modal-styles">
                .crop-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.3s ease;
                }
                
                .crop-modal.show {
                    opacity: 1;
                    visibility: visible;
                }
                
                .crop-modal-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(5px);
                }
                
                .crop-modal-content {
                    position: relative;
                    background: white;
                    border-radius: 15px;
                    max-width: 90vw;
                    max-height: 90vh;
                    overflow: hidden;
                    box-shadow: 0 25px 80px rgba(0, 0, 0, 0.3);
                    transform: scale(0.9);
                    transition: transform 0.3s ease;
                }
                
                .crop-modal.show .crop-modal-content {
                    transform: scale(1);
                }
                
                .crop-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.5rem 2rem;
                    border-bottom: 1px solid #e5e7eb;
                    background: #f8fafc;
                }
                
                .crop-modal-header h3 {
                    margin: 0;
                    color: #1f2937;
                    font-size: 1.25rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                .crop-close-btn {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    color: #6b7280;
                    cursor: pointer;
                    padding: 0.5rem;
                    border-radius: 50%;
                    transition: all 0.3s ease;
                }
                
                .crop-close-btn:hover {
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                }
                
                .crop-modal-body {
                    padding: 2rem;
                    max-height: 70vh;
                    overflow-y: auto;
                }
                
                .crop-controls {
                    display: flex;
                    gap: 2rem;
                    margin-bottom: 2rem;
                    padding: 1rem;
                    background: #f8fafc;
                    border-radius: 10px;
                    flex-wrap: wrap;
                }
                
                .crop-control-group {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    min-width: 150px;
                }
                
                .crop-control-group label {
                    font-weight: 500;
                    color: #374151;
                    min-width: 60px;
                }
                
                .crop-control-group input[type="range"] {
                    flex: 1;
                    height: 6px;
                    border-radius: 3px;
                    background: #e5e7eb;
                    outline: none;
                    opacity: 0.7;
                    transition: opacity 0.3s;
                }
                
                .crop-control-group input[type="range"]:hover {
                    opacity: 1;
                }
                
                .crop-control-group input[type="range"]::-webkit-slider-thumb {
                    appearance: none;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    cursor: pointer;
                    box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3);
                }
                
                .rotate-btn {
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                    border: none;
                    padding: 0.5rem;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
                }
                
                .rotate-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
                }
                
                .crop-control-group select {
                    padding: 0.5rem;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    background: white;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .crop-control-group select:focus {
                    outline: none;
                    border-color: #667eea;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }
                
                .crop-canvas-container {
                    position: relative;
                    display: inline-block;
                    margin-bottom: 2rem;
                    background: #f3f4f6;
                    border-radius: 10px;
                    overflow: hidden;
                }
                
                .crop-canvas {
                    display: block;
                    max-width: 100%;
                    max-height: 400px;
                    cursor: grab;
                }
                
                .crop-canvas:active {
                    cursor: grabbing;
                }
                
                .crop-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    background: rgba(0, 0, 0, 0.5);
                }
                
                .crop-selection {
                    position: absolute;
                    border: 2px solid #667eea;
                    background: transparent;
                    pointer-events: all;
                    cursor: move;
                    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
                }
                
                .crop-handle {
                    position: absolute;
                    width: 12px;
                    height: 12px;
                    background: #667eea;
                    border: 2px solid white;
                    border-radius: 50%;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                    pointer-events: all;
                }
                
                .crop-handle-nw { top: -6px; left: -6px; cursor: nw-resize; }
                .crop-handle-ne { top: -6px; right: -6px; cursor: ne-resize; }
                .crop-handle-sw { bottom: -6px; left: -6px; cursor: sw-resize; }
                .crop-handle-se { bottom: -6px; right: -6px; cursor: se-resize; }
                .crop-handle-n { top: -6px; left: 50%; transform: translateX(-50%); cursor: n-resize; }
                .crop-handle-s { bottom: -6px; left: 50%; transform: translateX(-50%); cursor: s-resize; }
                .crop-handle-w { left: -6px; top: 50%; transform: translateY(-50%); cursor: w-resize; }
                .crop-handle-e { right: -6px; top: 50%; transform: translateY(-50%); cursor: e-resize; }
                
                .crop-preview {
                    text-align: center;
                    padding: 1rem;
                    background: #f8fafc;
                    border-radius: 10px;
                }
                
                .crop-preview h4 {
                    margin: 0 0 1rem 0;
                    color: #374151;
                    font-weight: 500;
                }
                
                .crop-preview canvas {
                    border: 3px solid #667eea;
                    border-radius: 50%;
                    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
                }
                
                .crop-modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                    padding: 1.5rem 2rem;
                    border-top: 1px solid #e5e7eb;
                    background: #f8fafc;
                }
                
                .crop-btn {
                    padding: 0.75rem 1.5rem;
                    border: none;
                    border-radius: 8px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                .crop-btn-primary {
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
                }
                
                .crop-btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
                }
                
                .crop-btn-secondary {
                    background: #f3f4f6;
                    color: #374151;
                    border: 1px solid #d1d5db;
                }
                
                .crop-btn-secondary:hover {
                    background: #e5e7eb;
                    transform: translateY(-2px);
                }
                
                #zoomValue {
                    min-width: 40px;
                    font-weight: 500;
                    color: #667eea;
                }
                
                @media (max-width: 768px) {
                    .crop-modal-content {
                        max-width: 95vw;
                        margin: 1rem;
                    }
                    
                    .crop-controls {
                        flex-direction: column;
                        gap: 1rem;
                    }
                    
                    .crop-control-group {
                        min-width: 100%;
                    }
                    
                    .crop-modal-footer {
                        flex-direction: column;
                    }
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }
    
    // Setup event listeners for the cropper
    setupEventListeners() {
        // File input triggers
        const fileInputs = document.querySelectorAll('input[type="file"][accept*="image"]');
        fileInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.openCropper(e.target.files[0]);
                }
            });
        });
        
        // Profile picture click handlers
        const profilePics = document.querySelectorAll('.profile-pic-upload, .profile-avatar');
        profilePics.forEach(pic => {
            pic.addEventListener('click', () => {
                this.triggerFileSelect();
            });
        });
        
        // Modal event listeners will be added after modal creation
        document.addEventListener('DOMContentLoaded', () => {
            this.setupModalListeners();
        });
        
        // If DOM already loaded, setup immediately
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupModalListeners();
            });
        } else {
            this.setupModalListeners();
        }
    }
    
    setupModalListeners() {
        if (!this.modal) return;
        
        // Close modal
        const closeBtn = this.modal.querySelector('.crop-close-btn');
        const overlay = this.modal.querySelector('.crop-modal-overlay');
        const cancelBtn = this.modal.querySelector('#cancelCrop');
        
        [closeBtn, overlay, cancelBtn].forEach(el => {
            if (el) {
                el.addEventListener('click', () => this.closeCropper());
            }
        });
        
        // Control buttons
        const resetBtn = this.modal.querySelector('#resetCrop');
        const applyBtn = this.modal.querySelector('#applyCrop');
        
        if (resetBtn) resetBtn.addEventListener('click', () => this.resetCrop());
        if (applyBtn) applyBtn.addEventListener('click', () => this.applyCrop());
        
        // Zoom control
        const zoomSlider = this.modal.querySelector('#zoomSlider');
        const zoomValue = this.modal.querySelector('#zoomValue');
        
        if (zoomSlider && zoomValue) {
            zoomSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                zoomValue.textContent = Math.round(value * 100) + '%';
                this.applyZoom(value);
            });
        }
        
        // Rotation buttons
        const rotateButtons = this.modal.querySelectorAll('.rotate-btn');
        rotateButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const angle = parseInt(e.currentTarget.dataset.angle);
                this.rotateImage(angle);
            });
        });
        
        // Filter select
        const filterSelect = this.modal.querySelector('#filterSelect');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.applyFilter(e.target.value);
            });
        }
        
        // Canvas interaction
        if (this.canvas && this.cropSelection) {
            this.setupCanvasInteraction();
        }
    }
    
    // Setup canvas and crop selection interaction
    setupCanvasInteraction() {
        // Canvas mouse events
        this.canvas.addEventListener('mousedown', this.handleCanvasMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleCanvasMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleCanvasMouseUp.bind(this));
        
        // Crop selection interaction
        this.cropSelection.addEventListener('mousedown', this.handleCropMouseDown.bind(this));
        
        // Resize handles
        const handles = this.modal.querySelectorAll('.crop-handle');
        handles.forEach(handle => {
            handle.addEventListener('mousedown', this.handleResizeMouseDown.bind(this));
        });
        
        // Global mouse events
        document.addEventListener('mousemove', this.handleGlobalMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleGlobalMouseUp.bind(this));
        
        // Touch events for mobile
        this.setupTouchEvents();
    }
    
    setupTouchEvents() {
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        
        this.cropSelection.addEventListener('touchstart', this.handleCropTouchStart.bind(this), { passive: false });
    }
    
    // Trigger file selection
    triggerFileSelect() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';
        
        input.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.openCropper(e.target.files[0]);
            }
            document.body.removeChild(input);
        });
        
        document.body.appendChild(input);
        input.click();
    }
    
    // Main function to open the cropper with an image file
    async openCropper(file) {
        try {
            // Validate file
            if (!this.validateFile(file)) {
                return;
            }
            
            // Show loading
            this.showLoading('Loading image...');
            
            // Load image
            const imageUrl = URL.createObjectURL(file);
            await this.loadImage(imageUrl);
            
            // Setup initial crop area
            this.setupInitialCrop();
            
            // Show modal
            this.showModal();
            
            // Update preview
            this.updatePreview();
            
            // Hide loading
            this.hideLoading();
            
            console.log('Cropper opened successfully');
            
        } catch (error) {
            console.error('Error opening cropper:', error);
            this.showError('Failed to load image. Please try again.');
            this.hideLoading();
        }
    }
    
    // Validate uploaded file
    validateFile(file) {
        // Check file type
        if (!this.options.allowedTypes.includes(file.type)) {
            this.showError('Please select a valid image file (JPEG, PNG, or WebP).');
            return false;
        }
        
        // Check file size
        if (file.size > this.options.maxSize) {
            const maxSizeMB = Math.round(this.options.maxSize / (1024 * 1024));
            this.showError(`File size must be less than ${maxSizeMB}MB.`);
            return false;
        }
        
        return true;
    }
    
    // Load image onto canvas
    loadImage(src) {
        return new Promise((resolve, reject) => {
            this.image = new Image();
            
            this.image.onload = () => {
                // Calculate canvas size to fit image
                const maxWidth = 600;
                const maxHeight = 400;
                let { width, height } = this.image;
                
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width *= ratio;
                    height *= ratio;
                }
                
                this.canvas.width = width;
                this.canvas.height = height;
                
                // Draw image
                this.ctx.clearRect(0, 0, width, height);
                this.ctx.drawImage(this.image, 0, 0, width, height);
                
                // Store original image data
                this.originalImageData = this.ctx.getImageData(0, 0, width, height);
                
                resolve();
            };
            
            this.image.onerror = () => {
                reject(new Error('Failed to load image'));
            };
            
            this.image.src = src;
        });
    }
    
    // Setup initial crop selection area
    setupInitialCrop() {
        const canvasRect = this.canvas.getBoundingClientRect();
        const containerRect = this.canvas.parentElement.getBoundingClientRect();
        
        // Calculate initial crop size (square)
        const size = Math.min(this.canvas.width, this.canvas.height) * 0.7;
        const x = (this.canvas.width - size) / 2;
        const y = (this.canvas.height - size) / 2;
        
        // Set crop data
        this.cropData = { x, y, width: size, height: size };
        
        // Update crop selection position
        this.updateCropSelection();
    }
    
    // Update crop selection visual position
    updateCropSelection() {
        const canvasRect = this.canvas.getBoundingClientRect();
        const containerRect = this.canvas.parentElement.getBoundingClientRect();
        
        const scaleX = this.canvas.offsetWidth / this.canvas.width;
        const scaleY = this.canvas.offsetHeight / this.canvas.height;
        
        const left = this.cropData.x * scaleX;
        const top = this.cropData.y * scaleY;
        const width = this.cropData.width * scaleX;
        const height = this.cropData.height * scaleY;
        
        this.cropSelection.style.left = left + 'px';
        this.cropSelection.style.top = top + 'px';
        this.cropSelection.style.width = width + 'px';
        this.cropSelection.style.height = height + 'px';
    }
    
    // Mouse event handlers for canvas interaction
    handleCanvasMouseDown(e) {
        if (e.target === this.canvas) {
            this.isDragging = true;
            const rect = this.canvas.getBoundingClientRect();
            this.startPos = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        }
    }
    
    handleCanvasMouseMove(e) {
        if (this.isDragging) {
            const rect = this.canvas.getBoundingClientRect();
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;
            
            const deltaX = currentX - this.startPos.x;
            const deltaY = currentY - this.startPos.y;
            
            // Move crop area
            this.moveCropArea(deltaX, deltaY);
            
            this.startPos = { x: currentX, y: currentY };
        }
    }
    
    handleCanvasMouseUp() {
        this.isDragging = false;
    }
    
    handleCropMouseDown(e) {
        e.stopPropagation();
        this.isDragging = true;
        
        const rect = this.canvas.getBoundingClientRect();
        this.startPos = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    
    handleResizeMouseDown(e) {
        e.stopPropagation();
        this.isResizing = true;
        this.resizeHandle = e.target.classList[1]; // Get handle type
        
        const rect = this.canvas.getBoundingClientRect();
        this.startPos = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    
    handleGlobalMouseMove(e) {
        if (this.isDragging && !this.isResizing) {
            const rect = this.canvas.getBoundingClientRect();
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;
            
            const deltaX = currentX - this.startPos.x;
            const deltaY = currentY - this.startPos.y;
            
            this.moveCropArea(deltaX, deltaY);
            
            this.startPos = { x: currentX, y: currentY };
        } else if (this.isResizing) {
            const rect = this.canvas.getBoundingClientRect();
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;
            
            this.resizeCropArea(currentX, currentY);
        }
    }
    
    handleGlobalMouseUp() {
        this.isDragging = false;
        this.isResizing = false;
        this.resizeHandle = null;
    }
    
    // Touch event handlers for mobile support
    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.handleCanvasMouseDown({ 
            target: e.target,
            clientX: touch.clientX, 
            clientY: touch.clientY 
        });
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.handleGlobalMouseMove({ 
            clientX: touch.clientX, 
            clientY: touch.clientY 
        });
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        this.handleGlobalMouseUp();
    }
    
    handleCropTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.handleCropMouseDown({ 
            target: e.target,
            clientX: touch.clientX, 
            clientY: touch.clientY,
            stopPropagation: () => {}
        });
    }
    
    // Move crop area within canvas bounds
    moveCropArea(deltaX, deltaY) {
        const scaleX = this.canvas.width / this.canvas.offsetWidth;
        const scaleY = this.canvas.height / this.canvas.offsetHeight;
        
        const newX = this.cropData.x + (deltaX * scaleX);
        const newY = this.cropData.y + (deltaY * scaleY);
        
        // Keep within bounds
        this.cropData.x = Math.max(0, Math.min(newX, this.canvas.width - this.cropData.width));
        this.cropData.y = Math.max(0, Math.min(newY, this.canvas.height - this.cropData.height));
        
        this.updateCropSelection();
        this.updatePreview();
    }
    
    // Resize crop area based on handle
    resizeCropArea(currentX, currentY) {
        const scaleX = this.canvas.width / this.canvas.offsetWidth;
        const scaleY = this.canvas.height / this.canvas.offsetHeight;
        
        const canvasX = currentX * scaleX;
        const canvasY = currentY * scaleY;
        
        let newX = this.cropData.x;
        let newY = this.cropData.y;
        let newWidth = this.cropData.width;
        let newHeight = this.cropData.height;
        
        // Handle different resize directions
        switch (this.resizeHandle) {
            case 'crop-handle-se': // Southeast
                newWidth = canvasX - this.cropData.x;
                newHeight = canvasY - this.cropData.y;
                break;
            case 'crop-handle-nw': // Northwest
                newX = canvasX;
                newY = canvasY;
                newWidth = this.cropData.x + this.cropData.width - canvasX;
                newHeight = this.cropData.y + this.cropData.height - canvasY;
                break;
            case 'crop-handle-ne': // Northeast
                newY = canvasY;
                newWidth = canvasX - this.cropData.x;
                newHeight = this.cropData.y + this.cropData.height - canvasY;
                break;
            case 'crop-handle-sw': // Southwest
                newX = canvasX;
                newWidth = this.cropData.x + this.cropData.width - canvasX;
                newHeight = canvasY - this.cropData.y;
                break;
        }
        
        // Maintain minimum size and aspect ratio for square crop
        const minSize = this.options.minCropSize;
        if (newWidth >= minSize && newHeight >= minSize) {
            // For square crop, use the smaller dimension
            const size = Math.min(newWidth, newHeight);
            
            this.cropData.x = Math.max(0, Math.min(newX, this.canvas.width - size));
            this.cropData.y = Math.max(0, Math.min(newY, this.canvas.height - size));
            this.cropData.width = Math.min(size, this.canvas.width - this.cropData.x);
            this.cropData.height = Math.min(size, this.canvas.height - this.cropData.y);
            
            this.updateCropSelection();
            this.updatePreview();
        }
    }
    
    // Apply zoom to image
    applyZoom(scale) {
        if (!this.originalImageData) return;
        
        // Restore original image
        this.ctx.putImageData(this.originalImageData, 0, 0);
        
        // Apply zoom by scaling
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.ctx.scale(scale, scale);
        this.ctx.translate(-centerX, -centerY);
        
        // Redraw image
        this.ctx.drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
        
        this.updatePreview();
    }
    
    // Rotate image
    rotateImage(angle) {
        if (!this.originalImageData) return;
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate((angle * Math.PI) / 180);
        this.ctx.translate(-centerX, -centerY);
        
        // Clear and redraw
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
        
        this.updatePreview();
    }
    
    // Apply image filters
    applyFilter(filterType) {
        if (!this.originalImageData) return;
        
        // Restore original image first
        this.ctx.putImageData(this.originalImageData, 0, 0);
        
        // Apply filter
        switch (filterType) {
            case 'brightness':
                this.ctx.filter = 'brightness(1.2)';
                break;
            case 'contrast':
                this.ctx.filter = 'contrast(1.3)';
                break;
            case 'saturation':
                this.ctx.filter = 'saturate(1.5)';
                break;
            case 'sepia':
                this.ctx.filter = 'sepia(0.8)';
                break;
            case 'grayscale':
                this.ctx.filter = 'grayscale(1)';
                break;
            case 'none':
            default:
                this.ctx.filter = 'none';
                break;
        }
        
        // Redraw image with filter
        this.ctx.drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height);
        this.ctx.filter = 'none'; // Reset filter
        
        this.updatePreview();
    }
    
    // Update preview canvas
    updatePreview() {
        if (!this.previewCanvas || !this.previewCtx) return;
        
        // Clear preview
        this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
        
        // Get cropped image data
        const imageData = this.ctx.getImageData(
            this.cropData.x, 
            this.cropData.y, 
            this.cropData.width, 
            this.cropData.height
        );
        
        // Create temporary canvas for cropped area
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = this.cropData.width;
        tempCanvas.height = this.cropData.height;
        tempCtx.putImageData(imageData, 0, 0);
        
        // Draw scaled version to preview
        this.previewCtx.drawImage(
            tempCanvas, 
            0, 0, this.cropData.width, this.cropData.height,
            0, 0, this.previewCanvas.width, this.previewCanvas.height
        );
    }
    
    // Reset crop to initial state
    resetCrop() {
        if (this.originalImageData) {
            this.ctx.putImageData(this.originalImageData, 0, 0);
        }
        
        // Reset controls
        const zoomSlider = this.modal.querySelector('#zoomSlider');
        const zoomValue = this.modal.querySelector('#zoomValue');
        const filterSelect = this.modal.querySelector('#filterSelect');
        
        if (zoomSlider) zoomSlider.value = '1';
        if (zoomValue) zoomValue.textContent = '100%';
        if (filterSelect) filterSelect.value = 'none';
        
        // Reset crop area
        this.setupInitialCrop();
        this.updatePreview();
    }
    
    // Apply crop and return result
    async applyCrop() {
        try {
            this.showLoading('Processing image...');
            
            // Create final cropped image
            const croppedCanvas = document.createElement('canvas');
            const croppedCtx = croppedCanvas.getContext('2d');
            
            // Set output size
            croppedCanvas.width = this.options.cropSize;
            croppedCanvas.height = this.options.cropSize;
            
            // Get cropped image data
            const imageData = this.ctx.getImageData(
                this.cropData.x, 
                this.cropData.y, 
                this.cropData.width, 
                this.cropData.height
            );
            
            // Create temporary canvas
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = this.cropData.width;
            tempCanvas.height = this.cropData.height;
            tempCtx.putImageData(imageData, 0, 0);
            
            // Draw scaled to final size
            croppedCtx.drawImage(
                tempCanvas, 
                0, 0, this.cropData.width, this.cropData.height,
                0, 0, this.options.cropSize, this.options.cropSize
            );
            
            // Convert to blob
            const blob = await new Promise(resolve => {
                croppedCanvas.toBlob(resolve, this.options.outputFormat, this.options.outputQuality);
            });
            
            // Create result object
            const result = {
                blob: blob,
                dataUrl: croppedCanvas.toDataURL(this.options.outputFormat, this.options.outputQuality),
                canvas: croppedCanvas
            };
            
            // Trigger success callback
            this.onCropComplete(result);
            
            // Close modal
            this.closeCropper();
            
            this.hideLoading();
            this.showSuccess('Profile picture updated successfully!');
            
        } catch (error) {
            console.error('Error applying crop:', error);
            this.showError('Failed to process image. Please try again.');
            this.hideLoading();
        }
    }
    
    // Handle crop completion
    onCropComplete(result) {
        // Update all profile pictures on page
        const profileImages = document.querySelectorAll('.profile-avatar, .profile-pic');
        profileImages.forEach(img => {
            img.src = result.dataUrl;
        });
        
        // Trigger custom event
        const event = new CustomEvent('profilePictureCropped', {
            detail: result
        });
        document.dispatchEvent(event);
        
        // In a real app, you would upload the blob to your server
        console.log('Profile picture cropped successfully', result);
    }
    
    // Modal display functions
    showModal() {
        if (this.modal) {
            this.modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            setTimeout(() => {
                this.modal.classList.add('show');
            }, 10);
        }
    }
    
    closeCropper() {
        if (this.modal) {
            this.modal.classList.remove('show');
            document.body.style.overflow = '';
            
            setTimeout(() => {
                this.modal.style.display = 'none';
            }, 300);
        }
    }
    
    // Utility functions
    showLoading(message) {
        // Create loading overlay
        const loading = document.createElement('div');
        loading.id = 'cropLoading';
        loading.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 15000; display: flex; align-items: center; justify-content: center; color: white;">
                <div style="text-align: center;">
                    <div style="border: 3px solid #f3f3f3; border-top: 3px solid #667eea; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
                    <div>${message}</div>
                </div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        document.body.appendChild(loading);
    }
    
    hideLoading() {
        const loading = document.getElementById('cropLoading');
        if (loading) {
            loading.remove();
        }
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    showSuccess(message) {
        this.showNotification(message, 'success');
    }
    
    showNotification(message, type = 'info') {
        // Create notification
        const notification = document.createElement('div');
        notification.className = `crop-notification crop-notification-${type}`;
        notification.innerHTML = `
            <div style="position: fixed; top: 20px; right: 20px; background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'}; color: white; padding: 1rem 1.5rem; border-radius: 8px; z-index: 20000; box-shadow: 0 8px 25px rgba(0,0,0,0.3); animation: slideIn 0.3s ease;">
                <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : type === 'success' ? 'check' : 'info-circle'}"></i>
                ${message}
            </div>
            <style>
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            </style>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}

// Initialize cropper when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize with default options
    window.profileCropper = new ProfilePictureCropper({
        maxSize: 3 * 1024 * 1024, // 3MB
        cropSize: 400, // 400x400 output
        outputQuality: 0.9
    });
    
    console.log('Profile Picture Cropper initialized');
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProfilePictureCropper;
}
