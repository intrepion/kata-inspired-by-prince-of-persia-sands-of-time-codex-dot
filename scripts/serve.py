#!/usr/bin/env python3
"""Session-only loopback preview. No boot/login registration."""
import functools, http.server, pathlib, sys
root = pathlib.Path(__file__).resolve().parent.parent / 'dist'
port = int(sys.argv[1]) if len(sys.argv) > 1 else 5193
class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
http.server.ThreadingHTTPServer(('127.0.0.1', port), functools.partial(Handler, directory=str(root))).serve_forever()
