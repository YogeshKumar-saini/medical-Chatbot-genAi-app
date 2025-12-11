# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies
# libsndfile1 is required for librosa
# ffmpeg is often required for audio processing
RUN apt-get update && apt-get install -y \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container at /app
COPY requirements.txt /app/

# Install specific versions of libraries to avoid conflicts
# It is often safer to let pip handle resolution from requirements.txt, 
# but if there are known issues, we can pre-install some. 
# For now, we stick to requirements.txt.
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . /app

# Expose port 8000
EXPOSE 8000

# Run the application
# Using uvicorn to run the FastAPI app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
