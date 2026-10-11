#!/usr/bin/env python3
"""Detach an owned preview only; never terminate another process."""
import pathlib, socket, subprocess, sys, time, urllib.request, urllib.request
root = pathlib.Path(__file__).resolve().parent.parent
port = int(sys.argv[1]) if len(sys.argv)>1 else 5193
if not (root/'dist/index.html').exists():
    raise SystemExit('Build first: npm run build')
with socket.socket() as probe:
    if probe.connect_ex(('127.0.0.1',port)) == 0:
        raise SystemExit(f'Port {port} is occupied. Existing server preserved; choose a free port.')
with (root/'preview.log').open('ab') as log:
    process = subprocess.Popen([sys.executable,str(root/'scripts/serve.py'),str(port)],stdin=subprocess.DEVNULL,stdout=log,stderr=log,start_new_session=True,close_fds=True,cwd=root)
(root/'preview.pid').write_text(str(process.pid))
for attempt in range(30):
    if process.poll() is not None:
        raise SystemExit('Preview failed to start. Inspect preview.log.')
    try:
        with urllib.request.urlopen(f'http://127.0.0.1:{port}/', timeout=0.2) as response:
            if response.status == 200:
                print(f'Preview PID {process.pid}: http://127.0.0.1:{port}/ — HTTP 200')
                break
    except OSError:
        time.sleep(0.1)
else:
    raise SystemExit('Preview did not become ready. Inspect preview.log and preview.pid.')
