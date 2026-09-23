import functools
import http.server
import os
import socketserver

port = int(os.environ.get("PORT", "8000"))
directory = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "prototype")

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    # Estamos iterando o protótipo o tempo todo — sem isso, o navegador
    # reaproveita respostas antigas (304 com corpo em cache) e mostra telas
    # já reescritas como se ainda fossem a versão anterior.
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


Handler = functools.partial(NoCacheHandler, directory=directory)


class ThreadingHTTPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    # Cada página carrega vários <script src> e assets em paralelo — um
    # servidor single-threaded (TCPServer puro) trava/derruba conexões sob
    # essa carga concorrente, o que aparecia como "ERR_CONNECTION_REFUSED"
    # no navegador. ThreadingMixIn atende cada conexão em sua própria thread.
    daemon_threads = True
    allow_reuse_address = True


with ThreadingHTTPServer(("", port), Handler) as httpd:
    print("Serving " + directory + " at port " + str(port))
    httpd.serve_forever()
