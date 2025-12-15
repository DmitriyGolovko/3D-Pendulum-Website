// Node.js HTTP server that always serves from Server/Websites/
const http = require('http');
const fs = require('fs');
const path = require('path');

const HOST = 'localhost';
const PORT = 80;
// Always serve from Server/Websites/ relative to this script
const WEBSITE_DIR = path.join(__dirname, 'Server', 'Websites');

const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);

    // Map URL to file path
    let filePath = path.join(WEBSITE_DIR, req.url === '/' ? 'index.html' : req.url);

    // Security: prevent directory traversal (e.g., ../../etc/passwd)
    if (!filePath.startsWith(WEBSITE_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/html' });
        res.end('<h1>403 Forbidden</h1><p>Directory traversal not allowed.</p>');
        return;
    }

    // Check if the file exists
    fs.stat(filePath, (err, stats) => {
        if (err) {
            // File not found
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 Not Found</h1><p>The requested file was not found.</p>');
            return;
        }

        if (stats.isDirectory()) {
            // If it’s a directory, try to serve index.html inside it
            const indexPath = path.join(filePath, 'index.html');
            fs.access(indexPath, fs.constants.F_OK, (accessErr) => {
                if (accessErr) {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end('<h1>404 Not Found</h1><p>No index.html in this directory.</p>');
                } else {
                    serveFile(indexPath, res);
                }
            });
        } else {
            // Serve the file
            serveFile(filePath, res);
        }
    });
});

// Helper: serve a file with correct MIME type
function serveFile(filePath, res) {
    const extname = path.extname(filePath).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.pdf': 'application/pdf',
        '.txt': 'text/plain',
        '.svg': 'image/svg+xml'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end('<h1>500 Internal Server Error</h1>');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
}

// Start the server
server.listen(PORT, HOST, () => {
  const addr = server.address();
  console.log(`Server running at http://${addr.address}:${addr.port}/`);
  console.log(`Serving files from: ${WEBSITE_DIR}`);
});
