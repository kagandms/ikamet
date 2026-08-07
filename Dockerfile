# Use the official Python slim image
FROM python:3.10-slim

# Set the working directory
WORKDIR /app

# Install system dependencies required by PaddleOCR and OpenCV
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose port 7860 (Hugging Face Spaces default)
EXPOSE 7860

# Set environment variables
ENV PORT=7860
ENV PYTHONUNBUFFERED=1

# Run the Flask app using Gunicorn
CMD ["gunicorn", "-b", "0.0.0.0:7860", "--timeout", "120", "server:app"]
