// Image Importer JavaScript
class ImageImporter {
    constructor() {
        this.dropArea = document.getElementById('dropArea');
        this.warning = document.getElementById('warning');
        this.fileInfo = document.getElementById('fileInfo');
        this.fileDetails = document.getElementById('fileDetails');
        this.colorLayers = document.getElementById('colorLayers');
        this.originalImage = document.getElementById('originalImage');
        this.originalCanvas = document.getElementById('originalCanvas');
        this.imageDimensions = document.getElementById('imageDimensions');
        this.fileSize = document.getElementById('fileSize');
        this.colorCount = document.getElementById('colorCount');
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.dropArea.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });
        
        // Highlight drop area when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            this.dropArea.addEventListener(eventName, () => this.dropArea.classList.add('dragover'), false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            this.dropArea.addEventListener(eventName, () => this.dropArea.classList.remove('dragover'), false);
        });
        
        // Handle dropped files
        this.dropArea.addEventListener('drop', this.handleDrop.bind(this), false);
    }
    
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            this.handleFiles(files);
        }
    }
    
    handleFiles(files) {
        const file = files[0];
        
        if (!file.type.startsWith('image/')) {
            alert('Please drop an image file.');
            return;
        }
        
        // Store file size for display
        this.currentFileSize = file.size;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => this.processImage(img);
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    processImage(img) {
        // Check image size limits
        if (img.width > 2040 || img.height > 255) {
            alert('Image too large. Maximum size is 2040x255 pixels.');
            return;
        }
        
        // Calculate output dimensions (width must be divisible by 8)
        const outputWidth = Math.ceil(img.width / 8) * 8;
        const outputHeight = img.height;
        
        // Create canvas to process the image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = outputWidth;
        canvas.height = outputHeight;
        
        // Draw image to canvas
        ctx.drawImage(img, 0, 0, outputWidth, outputHeight);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, outputWidth, outputHeight);
        const data = imageData.data;
        
        // Find unique colors
        const colors = this.findUniqueColors(data, outputWidth, outputHeight);
        
        // Show warning if more than 4 colors
        if (colors.length > 4) {
            this.warning.style.display = 'block';
        } else {
            this.warning.style.display = 'none';
        }
        
        // Show file info
        this.fileDetails.textContent = `${outputWidth}x${outputHeight} pixels, ${colors.length} colors`;
        this.fileInfo.style.display = 'block';
        
        // Display original image
        this.displayOriginalImage(img, outputWidth, outputHeight, colors.length);
        
        // Clear previous results
        this.colorLayers.innerHTML = '';
        
        // Process each color
        colors.forEach((color, index) => {
            this.createColorLayer(color, imageData, outputWidth, outputHeight, index);
        });
    }
    
    findUniqueColors(data, width, height) {
        const colorMap = new Map();
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            
            // Skip transparent pixels
            if (a < 128) continue;
            
            const colorKey = `${r},${g},${b}`;
            if (!colorMap.has(colorKey)) {
                colorMap.set(colorKey, { r, g, b, key: colorKey });
            }
        }
        
        return Array.from(colorMap.values());
    }
    
    createColorLayer(color, imageData, width, height, index) {
        // Create binary data for this color
        const binaryData = this.createBinaryData(color, imageData, width, height);
        
        // Create the complete data array with header
        const completeData = [
            (binaryData.version << 4) | binaryData.flags, // Version and flags
            binaryData.width,  // Width in 8-pixel chunks
            binaryData.height, // Height
            ...binaryData.data // The actual data
        ];
        
        const hexString = this.binaryToHex(completeData);
        
        // Get all encoding sizes for comparison
        const rawBytes = this.createRawBytes(color, imageData, width, height);
        const rleBytes = this.encodeRLE(rawBytes);
        const bitRleBytes = this.encodeBitRLE(rawBytes);
        
        const rawSize = 3 + rawBytes.length; // Header + data
        const rleSize = 3 + rleBytes.length;
        const bitRleSize = 3 + bitRleBytes.length;
        
        // Create layer container
        const layerDiv = document.createElement('div');
        layerDiv.className = 'color-layer';
        
        // Create preview canvas
        const previewCanvas = document.createElement('canvas');
        previewCanvas.width = Math.min(width, 200);
        previewCanvas.height = Math.min(height, 200);
        const previewCtx = previewCanvas.getContext('2d');
        
        // Draw color preview
        this.drawColorPreview(previewCtx, color, imageData, width, height, previewCanvas.width, previewCanvas.height);
        
        // Create layer HTML
        layerDiv.innerHTML = `
            <div class="color-preview">
                <canvas width="${previewCanvas.width}" height="${previewCanvas.height}" style="background-color: ${this.getContrastingBackground(color)};"></canvas>
            </div>
            <div class="color-info">
                <div class="color-name">Color ${index + 1}: RGB(${color.r}, ${color.g}, ${color.b})</div>
                <div class="encoding-comparison">
                    <div class="encoding-size ${binaryData.encoding === 'Raw' ? 'selected' : ''}">Raw: ${rawSize} bytes</div>
                    <div class="encoding-size ${binaryData.encoding === 'RLE' ? 'selected' : ''}">RLE: ${rleSize} bytes</div>
                    <div class="encoding-size ${binaryData.encoding === 'BitRLE' ? 'selected' : ''}">BitRLE: ${bitRleSize} bytes</div>
                </div>
                <div class="hex-data" onclick="this.select()">${hexString}</div>
            </div>
        `;
        
        // Replace the canvas with our drawn version
        const canvasElement = layerDiv.querySelector('canvas');
        const canvasCtx = canvasElement.getContext('2d');
        canvasCtx.drawImage(previewCanvas, 0, 0);
        
        this.colorLayers.appendChild(layerDiv);
    }
    
    createRawBytes(targetColor, imageData, width, height) {
        const rawBytes = [];
        
        // Process each row to create raw binary data
        for (let y = 0; y < height; y++) {
            let byte = 0;
            let bitPosition = 7;
            
            for (let x = 0; x < width; x++) {
                const pixelIndex = (y * width + x) * 4;
                const r = imageData.data[pixelIndex];
                const g = imageData.data[pixelIndex + 1];
                const b = imageData.data[pixelIndex + 2];
                const a = imageData.data[pixelIndex + 3];
                
                // Check if pixel matches target color and is not transparent
                if (a >= 128 && r === targetColor.r && g === targetColor.g && b === targetColor.b) {
                    byte |= (1 << bitPosition);
                }
                
                bitPosition--;
                
                // When we've processed 8 pixels or reached end of row, add byte
                if (bitPosition < 0 || x === width - 1) {
                    rawBytes.push(byte);
                    byte = 0;
                    bitPosition = 7;
                }
            }
        }
        
        return rawBytes;
    }
    
    drawColorPreview(ctx, targetColor, imageData, srcWidth, srcHeight, dstWidth, dstHeight) {
        const scaleX = dstWidth / srcWidth;
        const scaleY = dstHeight / srcHeight;
        
        // Create a new image data for the preview
        const previewData = ctx.createImageData(dstWidth, dstHeight);
        const data = previewData.data;
        
        for (let y = 0; y < dstHeight; y++) {
            for (let x = 0; x < dstWidth; x++) {
                const srcX = Math.floor(x / scaleX);
                const srcY = Math.floor(y / scaleY);
                const srcIndex = (srcY * srcWidth + srcX) * 4;
                
                const r = imageData.data[srcIndex];
                const g = imageData.data[srcIndex + 1];
                const b = imageData.data[srcIndex + 2];
                const a = imageData.data[srcIndex + 3];
                
                const pixelIndex = (y * dstWidth + x) * 4;
                
                // Check if this pixel matches the target color
                if (a >= 128 && r === targetColor.r && g === targetColor.g && b === targetColor.b) {
                    data[pixelIndex] = r;
                    data[pixelIndex + 1] = g;
                    data[pixelIndex + 2] = b;
                    data[pixelIndex + 3] = 255;
                } else {
                    data[pixelIndex] = 0;
                    data[pixelIndex + 1] = 0;
                    data[pixelIndex + 2] = 0;
                    data[pixelIndex + 3] = 0;
                }
            }
        }
        
        ctx.putImageData(previewData, 0, 0);
    }
    
    createBinaryData(targetColor, imageData, width, height) {
        const rawBytes = [];
        
        // Process each row to create raw binary data
        for (let y = 0; y < height; y++) {
            let byte = 0;
            let bitPosition = 7;
            
            for (let x = 0; x < width; x++) {
                const pixelIndex = (y * width + x) * 4;
                const r = imageData.data[pixelIndex];
                const g = imageData.data[pixelIndex + 1];
                const b = imageData.data[pixelIndex + 2];
                const a = imageData.data[pixelIndex + 3];
                
                // Check if pixel matches target color and is not transparent
                if (a >= 128 && r === targetColor.r && g === targetColor.g && b === targetColor.b) {
                    byte |= (1 << bitPosition);
                }
                
                bitPosition--;
                
                // When we've processed 8 pixels or reached end of row, add byte
                if (bitPosition < 0 || x === width - 1) {
                    rawBytes.push(byte);
                    byte = 0;
                    bitPosition = 7;
                }
            }
        }
        
        // Create both RLE encoded versions
        const rleBytes = this.encodeRLE(rawBytes);
        const bitRleBytes = this.encodeBitRLE(rawBytes);
        
        // Choose the smallest encoding
        const encodings = [
            { data: rawBytes, flags: 0, encoding: 'Raw' },
            { data: rleBytes, flags: 1, encoding: 'RLE' },
            { data: bitRleBytes, flags: 2, encoding: 'BitRLE' }
        ];
        
        const bestEncoding = encodings.reduce((smallest, current) => 
            current.data.length < smallest.data.length ? current : smallest
        );
        
        return {
            data: bestEncoding.data,
            version: 0,
            flags: bestEncoding.flags,
            width: width / 8,
            height: height,
            encoding: bestEncoding.encoding
        };
    }
    
    encodeRLE(data) {
        const encoded = [];
        let i = 0;
        
        while (i < data.length) {
            const value = data[i];
            let count = 1;
            
            // Count consecutive identical bytes
            while (i + count < data.length && data[i + count] === value && count < 255) {
                count++;
            }
            
            // Add count and value to encoded data
            encoded.push(count);
            encoded.push(value);
            
            i += count;
        }
        
        return encoded;
    }
    
    encodeBitRLE(data) {
        const encoded = [];
        let bitIndex = 0;
        let currentValue = null;
        let runLength = 0;
        
        // Convert data to bit array
        const bits = [];
        for (let i = 0; i < data.length; i++) {
            for (let bit = 7; bit >= 0; bit--) {
                bits.push((data[i] >> bit) & 1);
            }
        }
        
        // Process bits
        for (let i = 0; i < bits.length; i++) {
            const bit = bits[i];
            
            if (currentValue === null) {
                // First bit - determine starting value
                currentValue = bit;
                runLength = 1;
            } else if (bit === currentValue) {
                // Same value - continue run
                runLength++;
            } else {
                // Different value - output current run and start new one
                encoded.push((currentValue << 7) | (runLength & 0x7F));
                currentValue = bit;
                runLength = 1;
            }
        }
        
        // Output final run
        if (runLength > 0) {
            encoded.push((currentValue << 7) | (runLength & 0x7F));
        }
        
        return encoded;
    }
    
    binaryToHex(bytes) {
        return bytes.map(byte => byte.toString(16).padStart(2, '0').toUpperCase()).join('');
    }
    
    getContrastingBackground(color) {
        // Calculate the brightness of the color
        const brightness = (color.r * 299 + color.g * 587 + color.b * 114) / 1000;
        
        // If the color is bright, use a dark background, otherwise use a light background
        if (brightness > 128) {
            return '#333333'; // Dark gray for bright colors
        } else {
            return '#f0f0f0'; // Light gray for dark colors
        }
    }
    
    displayOriginalImage(img, outputWidth, outputHeight, colorCount) {
        // Set canvas size (scaled down if too large)
        const maxSize = 300;
        let canvasWidth = outputWidth;
        let canvasHeight = outputHeight;
        
        if (canvasWidth > maxSize || canvasHeight > maxSize) {
            const scale = Math.min(maxSize / canvasWidth, maxSize / canvasHeight);
            canvasWidth = Math.floor(canvasWidth * scale);
            canvasHeight = Math.floor(canvasHeight * scale);
        }
        
        this.originalCanvas.width = canvasWidth;
        this.originalCanvas.height = canvasHeight;
        
        // Draw the original image
        const ctx = this.originalCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
        
        // Update the information display
        this.imageDimensions.textContent = `${outputWidth} × ${outputHeight} pixels`;
        this.fileSize.textContent = this.formatFileSize(this.currentFileSize);
        this.colorCount.textContent = colorCount;
        
        // Show the original image section
        this.originalImage.style.display = 'block';
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize the importer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ImageImporter();
});
