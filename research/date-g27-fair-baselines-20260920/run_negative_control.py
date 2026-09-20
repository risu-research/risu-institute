#!/usr/bin/env python3
import pathlib,subprocess,sys,re,hashlib
base=pathlib.Path(__file__).resolve().parent
out=pathlib.Path(sys.argv[1]).resolve();out.mkdir(parents=True,exist_ok=True)
def run(args,timeout=85):return subprocess.run(args,capture_output=True,text=True,timeout=timeout)
original=(base/'g27_native_exhaustive_tb.v').read_text()
needle="expected=(idx==0)?8'h00:b;"
assert original.count(needle)==1
altered=original.replace(needle,"expected=(idx==0)?8'h00:((idx==30)?(b^8'h01):b);")
assert altered.replace("expected=(idx==0)?8'h00:((idx==30)?(b^8'h01):b);",needle)==original
(out/'NEGATIVE_ONLY_TESTBENCH.v').write_text(altered)
repo=out/'upstream';p=run(['git','clone','--filter=blob:none','https://github.com/olofk/serv.git',str(repo)],100)
(out/'CLONE.log').write_text(p.stdout+p.stderr+'\nexit='+str(p.returncode)+'\n');assert p.returncode==0
commit='41e8aeedfd1e9ad5f95902c5b0dfc83d1c99e5d2';p=run(['git','-C',str(repo),'checkout','--detach',commit]);assert p.returncode==0
source=repo/'servile/servile_rf_mem_if.v';s=source.read_bytes()
blob=hashlib.sha1(b'blob '+str(len(s)).encode()+b'\0'+s).hexdigest()
assert blob=='96ae03b503d4584faa42dd4b30609f63dc262192'
(out/'SOURCE_ID.txt').write_text(f'upstream_commit={commit}\nsource_git_blob={blob}\n')
args=['iverilog','-g2012','-s','g27_native_exhaustive_tb','-DCSR_ON','-o',str(out/'negative.vvp'),str(source),str(out/'NEGATIVE_ONLY_TESTBENCH.v')]
c=run(args);(out/'COMPILE.log').write_text(' '.join(args)+'\n'+c.stdout+c.stderr+'\nexit='+str(c.returncode)+'\n');assert c.returncode==0
sim=run(['vvp',str(out/'negative.vvp')],20)
raw=sim.stdout+sim.stderr
(out/'NEGATIVE_SIMULATION.log').write_text(raw+'\nexit='+str(sim.returncode)+'\n')
matches=re.findall(r'^RESULT csr=(\d+) checks=(\d+) errors=(\d+) x0=(\d+) x30=(\d+) x31=(\d+) other=(\d+)$',raw,re.M)
assert sim.returncode!=0 and len(matches)==1 and tuple(map(int,matches[0]))==(1,32768,1024,0,1024,0,0),f'negative control invalid: return {sim.returncode} matches {matches}'
assert 'control/non-target failure' in raw
print('G27 NEGATIVE-REFERENCE CONTROL PASS: 1024/1024 injected x30 mismatches detected, original repaired DUT unchanged')
(out/'STATUS.txt').write_text('negative_control=PASS\noriginal_DUT=UNCHANGED\nintentionally_failing_simulation_exit='+str(sim.returncode)+'\n')
