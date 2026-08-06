import os
import cv2
import numpy as np
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from paddleocr import PaddleOCR

# Configure Flask to serve static files from the current directory
app = Flask(__name__)
# Enable CORS for all domains so app.js can access it
CORS(app)

@app.route('/')
def serve_index():
    return send_from_directory(os.getcwd(), 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(os.getcwd(), path)

# Initialize PaddleOCR
# use_angle_cls=True to automatically detect orientation
# lang='tr' for Turkish language support
try:
    print("Initializing PaddleOCR (this may download models on first run)...")
    ocr = PaddleOCR(use_angle_cls=True, lang='tr')
except Exception as e:
    print(f"Error initializing PaddleOCR: {e}")
    ocr = None

@app.route('/api/ocr', methods=['POST'])
def process_image():
    if ocr is None:
        return jsonify({"error": "PaddleOCR failed to initialize"}), 500
        
    if 'image' not in request.files:
        return jsonify({"error": "No image provided"}), 400
        
    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "Empty filename"}), 400
        
    try:
        # Read the image file into a numpy array
        file_bytes = np.frombuffer(file.read(), np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        
        if img is None:
            return jsonify({"error": "Failed to decode image"}), 400
            
        # Run OCR
        print(f"Processing image {file.filename} with shape {img.shape}")
        result = ocr.ocr(img, cls=True)
        
        # Format the output for the frontend
        # result format: [[[[x1,y1],[x2,y2],[x3,y3],[x4,y4]], ("text", confidence)], ...]
        formatted_result = []
        full_text_lines = []
        if result and result[0]:
            for line in result[0]:
                box = line[0]
                text = line[1][0]
                confidence = line[1][1]
                
                # box is [[x1, y1], [x2, y2], [x3, y3], [x4, y4]]
                xs = [pt[0] for pt in box]
                ys = [pt[1] for pt in box]
                
                formatted_result.append({
                    "text": text,
                    "bbox": {
                        "x0": min(xs),
                        "y0": min(ys),
                        "x1": max(xs),
                        "y1": max(ys)
                    },
                    "confidence": float(confidence)
                })
                full_text_lines.append(text)
                
        return jsonify({
            "success": True,
            "text": "\n".join(full_text_lines),
            "words": formatted_result,
            "image_width": img.shape[1],
            "image_height": img.shape[0]
        })
        
    except Exception as e:
        print(f"Error during OCR: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    print("Starting PaddleOCR server on port 5000...")
    app.run(host='0.0.0.0', port=5000, debug=False)
