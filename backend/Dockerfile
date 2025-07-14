FROM denoland/deno:ubuntu-2.0.0

WORKDIR /app

COPY . .

# Cache dependencies
RUN deno cache app.ts

# Expose port
EXPOSE 5000

# Run with permissions
CMD ["run", "--allow-net", "--allow-env", "--allow-read", "app.ts"]

