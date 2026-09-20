#!/usr/bin/env python3
"""Native-only testbench input adapter; original wbuart32 RTL never altered."""
import csv, hashlib, pathlib, re, subprocess, sys

work, out = map(pathlib.Path, sys.argv[1:3])
out.mkdir(exist_ok=True, parents=True)
original = (work / 'g25d_symbolic_frame_tb.sv').read_text()
needle = "reg [7:0] payload=8'ha5;"
assert original.count(needle) == 1, 'unexpected original fixture'
replacement = "reg [7:0] payload=8'ha5; initial begin if (!$value$plusargs(\"PAYLOAD=%h\",payload)) $fatal(1,\"missing payload\"); end"
adapted = original.replace(needle, replacement)
assert original.replace(needle,replacement).replace(replacement,needle)==original
(work / 'g25_final_native_adapter.sv').write_text(adapted)
(out / 'NATIVE_ADAPTER_SHA256.txt').write_text(hashlib.sha256(adapted.encode()).hexdigest()+'  g25_final_native_adapter.sv\n')
rtl = [str(work / (x+'.v')) for x in ('axiluart','ufifo','skidbuffer','txuart','rxuart')]
compile_cmd = ['iverilog','-g2012','-s','g25d_native_frame_tb','-o',str(work/'native256.vvp'),*rtl,str(work/'g25_final_native_adapter.sv')]
c = subprocess.run(compile_cmd,text=True,capture_output=True,timeout=40)
(out/'COMPILE.log').write_text(' '.join(compile_cmd)+'\n'+c.stdout+c.stderr+f'\nexit={c.returncode}\n')
if c.returncode: sys.exit(c.returncode)
rows=[]
raw = (out/'NATIVE_256_ALL.log').open('w')
pattern = re.compile(r'^FRAME_SAMPLE step=(\d+) serial=([01]) payload=([0-9a-fA-F]+) accepted=(\d+)$')
summary = re.compile(r'^FRAME_FULL_NATIVE_DONE accepted=(\d+) sampled=([0-9a-fA-F]+) byte=([0-9a-fA-F]+)$')
expected_times={17:0,21:1,25:2,29:3,33:4,37:5,41:6,45:7,49:8,53:9,57:10}
try:
 for value in range(256):
  try:
   run=subprocess.run(['vvp',str(work/'native256.vvp'),f'+PAYLOAD={value:02x}'],capture_output=True,text=True,timeout=4)
   log=run.stdout+run.stderr
   code=run.returncode
  except subprocess.TimeoutExpired as exc:
   log=(exc.stdout or b'').decode(errors='replace')+(exc.stderr or b'').decode(errors='replace')
   code=124
  raw.write(f'==== INPUT {value:02x} exit={code} ====\n'+log+'\n')
  samples={}
  for line in log.splitlines():
   m=pattern.fullmatch(line.strip())
   if m: samples[int(m.group(1))]=(int(m.group(2)),int(m.group(3),16),int(m.group(4)))
  matches=[m.groups() for line in log.splitlines() if (m:=summary.fullmatch(line.strip()))]
  good=(code==0 and len(matches)==1 and len(samples)==len(expected_times))
  if good:
   done=matches[0]
   good &= (int(done[0])==1 and int(done[1],16)==value and int(done[2],16)==value)
   for step,bit in expected_times.items():
    observed=samples.get(step)
    target=0 if step==17 else (value>>(step-21)//4)&1 if 21<=step<=49 else 1
    good &= observed == (target,value,1)
  rows.append((f'{value:02x}',code,len(samples),len(matches),'PASS' if good else 'FAIL'))
finally: raw.close()
with (out/'NATIVE_256_RESULTS.csv').open('w',newline='') as f:
 writer=csv.writer(f);writer.writerow(('payload_hex','exit_code','sample_count','completion_count','result'));writer.writerows(rows)
failed=[r for r in rows if r[-1]!='PASS']
(out/'NATIVE_256_SUMMARY.txt').write_text(f'tested={len(rows)} pass={len(rows)-len(failed)} fail={len(failed)}\nfirst_failures={failed[:12]}\n')
print((out/'NATIVE_256_SUMMARY.txt').read_text(),end='')
sys.exit(1 if failed or len(rows)!=256 else 0)
