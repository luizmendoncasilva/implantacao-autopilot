import functools
import http.server
import os
import socketserver

port = int(os.environ.get("PORT", "8000"))
directory = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "prototype")

Handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=directory)
socketserver.TCPServer.allow_reuse_address = True

with socketserver.TCPServer(("", port), Handler) as httpd:
    print("Serving " + directory + " at port " + str(port))
    httpd.serve_forever()
