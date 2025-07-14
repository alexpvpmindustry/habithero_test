# Use the official Bun image
FROM oven/bun:1.1

WORKDIR /app

# Copy project files
COPY . .

# Install dependencies from package.json
RUN bun install

# Expose port
EXPOSE 5001

# Run the application
CMD ["bun", "run", "app.ts"]