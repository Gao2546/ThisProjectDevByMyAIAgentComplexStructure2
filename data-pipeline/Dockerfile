# Use Node.js 18 LTS on a Debian-slim base image
FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY data-pipeline/package*.json ./

# Install Node.js dependencies
RUN npm install

# Create logs directory
RUN mkdir -p logs

# Copy application code (including requirements.txt)
COPY ./data-pipeline .

# --- START FIX: Install Python and requirements on Debian-based image ---

# 1. Install Python3 and pip using Debian's package manager (apt).
#    No need for extensive build-base or dev packages for most wheels on Debian.
#    `python3-venv` is needed to create virtual environments.
#    `build-essential` is a good general-purpose package for compiling if wheels aren't available for *all* packages.
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 2. Create a Virtual Environment for isolated package installation.
RUN python3 -m venv /app/venv

# 3. Upgrade pip, setuptools, and wheel inside the venv, then install application requirements.
RUN /app/venv/bin/pip install --upgrade pip setuptools wheel \
    && /app/venv/bin/pip install -r /app/requirements.txt

# --- END FIX ---

COPY ml-models /ml-models

# Create non-root user
RUN addgroup --system nodejs
RUN adduser --system --uid 1001 nextjs

# Change ownership of app files to non-root user (including the new venv)
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start the application
CMD ["npm", "start"]