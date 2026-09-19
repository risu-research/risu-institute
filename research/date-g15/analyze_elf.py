#!/usr/bin/env python3
"""Source-independent ELF accounting for the pinned Embench-IoT baseline pilot.

ROM proxy = sum of bytes in allocated, initialized ELF sections; includes
initialized RAM data; excludes holes, image headers and flash erase padding.
RAM static = allocated writable sections including NOBITS (not peak heap/stack).
This is NOT an official Embench score or a hardware speed/WCET/energy metric.
"""
import csv
import json
import sys
from pathlib import Path
from elftools.elf.elffile import ELFFile

out = Path(sys.argv[1]); variants = ('Os', 'O2', 'O3', 'OsLTO')
rows = []
for variant in variants:
    root = out / ('build-' + variant)
    found = []
    for path in sorted(root.rglob('*')):
        if not path.is_file() or path.stat().st_size < 64:
            continue
        with path.open('rb') as fp:
            if fp.read(4) != b'\x7fELF':
                continue
            fp.seek(0)
            elf = ELFFile(fp)
            if elf.header['e_machine'] != 'EM_RISCV' or elf.header['e_type'] not in ('ET_EXEC', 'ET_DYN'):
                continue
            if elf.elfclass != 32:
                raise AssertionError(f'Not RV32: {path}')
            alloc_init = alloc_write = exec_bytes = 0
            for sec in elf.iter_sections():
                flags = int(sec['sh_flags'])
                if not (flags & 2): # SHF_ALLOC
                    continue
                size = int(sec['sh_size'])
                if sec['sh_type'] != 'SHT_NOBITS':
                    alloc_init += size
                if flags & 1: # SHF_WRITE
                    alloc_write += size
                if flags & 4: # SHF_EXECINSTR
                    exec_bytes += size
            row = dict(variant=variant, benchmark=path.stem,
                       allocated_initialized_bytes=alloc_init,
                       allocated_writable_bytes=alloc_write,
                       executable_section_bytes=exec_bytes,
                       relative_path=str(path.relative_to(root)))
            rows.append(row); found.append(path.stem)
    if len(found) < 10 or len(found) != len(set(found)):
        raise AssertionError(f'{variant}: expected >=10 unique linked benchmarks, got {found}')
sets = [set(r['benchmark'] for r in rows if r['variant'] == v) for v in variants]
if any(s != sets[0] for s in sets[1:]):
    raise AssertionError('Different benchmark populations across compiler variants: '+repr(sets))
with (out/'results'/'elf_sections.csv').open('w', newline='') as f:
    w=csv.DictWriter(f, fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
by={(r['variant'],r['benchmark']):r for r in rows}
frontier = []
for name in sorted(sets[0]):
    ranked = sorted((by[(v,name)] for v in variants), key=lambda r:(r['allocated_initialized_bytes'],r['allocated_writable_bytes']))
    best=ranked[0]
    frontier.append(dict(benchmark=name,
                         smallest_rom_variant=best['variant'],
                         os_rom=by[('Os',name)]['allocated_initialized_bytes'],
                         best_rom=best['allocated_initialized_bytes'],
                         os_static_ram=by[('Os',name)]['allocated_writable_bytes'],
                         best_static_ram=best['allocated_writable_bytes']))
with (out/'results'/'per_benchmark_frontier.csv').open('w', newline='') as f:
    w=csv.DictWriter(f, fieldnames=list(frontier[0]));w.writeheader();w.writerows(frontier)
summary = {'release_commit':(out/'embench_commit.txt').read_text().strip(),
           'variants':list(variants),'benchmark_count':len(sets[0]),
           'programs':sorted(sets[0]),
           'os_minimum_rom_count':sum(x['smallest_rom_variant']=='Os' for x in frontier),
           'os_not_minimum_rom_count':sum(x['smallest_rom_variant']!='Os' for x in frontier),
           'evidence_scope':'RV32 linked ELF section accounting, no RV32 execution, no power, no WCET',
           'contribution_gate':'No novel algorithm or unsolved gap inferred from compiler-flag differences'}
(out/'results'/'summary.json').write_text(json.dumps(summary, indent=2)+'\n')
print(json.dumps(summary, indent=2))
