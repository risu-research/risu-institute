#!/usr/bin/env python3
from pathlib import Path
import argparse, subprocess, csv, re, hashlib, json

P = Path(__file__).resolve().parent / "artifact"
PINNED_EXE_SHA256 = "e540b4826363afb87c326446239a682d45086905425fa6299c103eca9693846d"
PINNED_VERSION_TOKEN = "4.11.0"

ap = argparse.ArgumentParser(description="Replay the 32-cell remote-store interface-propagation matrix with Dafny 4.11.0.")
ap.add_argument("dafny", help="absolute or relative path to the Dafny executable")
ap.add_argument("--timeout", type=int, default=180, help="wall-clock timeout per verifier process (seconds)")
ap.add_argument("--allow-unpinned", action="store_true", help="permit a different Dafny executable; provenance will record the mismatch")
args = ap.parse_args()

dafny = Path(args.dafny).resolve()
if not dafny.exists(): raise SystemExit(f"missing Dafny: {dafny}")
exe_sha = hashlib.sha256(dafny.read_bytes()).hexdigest()
version = subprocess.run([str(dafny), "--version"], capture_output=True, text=True, timeout=30)
version_text = (version.stdout + version.stderr).strip()
pinned_ok = (exe_sha == PINNED_EXE_SHA256 and PINNED_VERSION_TOKEN in version_text)
if not pinned_ok and not args.allow_unpinned:
    raise SystemExit(f"Dafny executable is not the pinned 4.11.0 build. sha256={exe_sha}, version={version_text!r}")

(P / "results").mkdir(exist_ok=True)
(P / "results" / "fresh_toolchain.json").write_text(json.dumps({"path":str(dafny),"sha256":exe_sha,"version":version_text,"pinned_expected_sha256":PINNED_EXE_SHA256,"pinned_expected_version_token":PINNED_VERSION_TOKEN,"pinned_match":pinned_ok,"allow_unpinned":args.allow_unpinned},indent=2)+"\n")
pat = re.compile(r"Dafny program verifier finished with (\d+) verified, (\d+) error")

def verify(cell_dir: Path, label: str, file: str):
    cmd=[str(dafny),"verify","--verification-time-limit","120",file]
    try:
        proc=subprocess.run(cmd,cwd=cell_dir,capture_output=True,text=True,timeout=args.timeout)
        out=proc.stdout+proc.stderr
        (P/"results"/f"{cell_dir.name}_{label}.log").write_text(out)
        m=pat.search(out)
        return {f"{label}_status":"RUN",f"{label}_rc":proc.returncode,f"{label}_verified":m.group(1) if m else "",f"{label}_errors":m.group(2) if m else "",f"{label}_pass":int(proc.returncode==0 and m and int(m.group(2))==0)}
    except subprocess.TimeoutExpired as exc:
        stdout=exc.stdout or ""; stderr=exc.stderr or ""
        if isinstance(stdout,bytes): stdout=stdout.decode(errors="replace")
        if isinstance(stderr,bytes): stderr=stderr.decode(errors="replace")
        (P/"results"/f"{cell_dir.name}_{label}.log").write_text(stdout+stderr+"\nTIMEOUT\n")
        return {f"{label}_status":"TIMEOUT",f"{label}_rc":"TIMEOUT",f"{label}_verified":"",f"{label}_errors":"",f"{label}_pass":0}

rows=[]
for d in sorted((P/"cells").iterdir()):
    if not d.is_dir(): continue
    row={"cell":d.name}; full=verify(d,"full","MemoryBackend.dfy"); row.update(full)
    if full["full_pass"]:
        for label,file in [("public","client_public.dfy"),("memory","client_memory.dfy"),("minimal","client_minimal.dfy")]: row.update(verify(d,label,file))
    else:
        for label in ["public","memory","minimal"]: row.update({f"{label}_status":"SKIP_FULL_FAIL",f"{label}_rc":"",f"{label}_verified":"",f"{label}_errors":"",f"{label}_pass":""})
    rows.append(row)
with (P/"results"/"fresh_verifier_matrix.csv").open("w",newline="") as f:
    fields=list(rows[0]); w=csv.DictWriter(f,fieldnames=fields); w.writeheader(); w.writerows(rows)
print(f"wrote {len(rows)} cells")
