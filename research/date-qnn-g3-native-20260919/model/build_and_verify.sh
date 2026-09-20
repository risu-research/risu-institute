#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p results/model
ORIGINAL_SCHEMA=tflm/tensorflow/compiler/mlir/lite/schema/schema.fbs
SCHEMA=results/model/schema_flatc2.fbs
MODEL=model/quantized_mul_adversarial.json
flatc --version | tee results/model/flatc_version.txt
git -C tflm rev-parse HEAD | tee results/model/tflm_commit.txt
[[ "$(cat results/model/tflm_commit.txt)" = 0ee39f5fc6629b7403166d325da374f01d890cf1 ]]
sha256sum "$ORIGINAL_SCHEMA" "$MODEL" > results/model/model_sources_sha256.txt
# System flatc 2.0.8 predates metadata on deprecated enum elements. Remove
# only those metadata annotations; preserve upstream schema and all wire values.
python3 - <<'PY'
from pathlib import Path
p=Path('tflm/tensorflow/compiler/mlir/lite/schema/schema.fbs');s=p.read_text()
assert s.count(' (deprecated)')==6
normalized=s.replace(' (deprecated)','')
assert normalized.replace('REDUCE_WINDOW = 205,','REDUCE_WINDOW = 205 (deprecated),') != ''
Path('results/model/schema_flatc2.fbs').write_text(normalized)
print('NORMALIZATION_DEPRECATED_ENUM_ANNOTATIONS',s.count(' (deprecated)'))
PY
sha256sum "$SCHEMA" >> results/model/model_sources_sha256.txt
flatc -b --strict-json -o results/model "$SCHEMA" "$MODEL"
# Schema explicitly declares file_extension "tflite", not "bin".
[[ -f results/model/quantized_mul_adversarial.tflite ]]
flatc -t --raw-binary --strict-json -o results/model "$SCHEMA" results/model/quantized_mul_adversarial.tflite
python3 - <<'PY'
from pathlib import Path
import json
p=Path('results/model/quantized_mul_adversarial.tflite'); b=p.read_bytes()
assert b[4:8]==b'TFL3' and len(b)>150
m=json.loads(Path('results/model/quantized_mul_adversarial.json').read_text())
assert m['version']==3 and len(m['subgraphs'])==1
s=m['subgraphs'][0];assert s['inputs']==[0,1] and s['outputs']==[2]
assert len(s['operators'])==1 and s['operators'][0]['builtin_options_type'] in ('MulOptions', 'BuiltinOptions_MulOptions')
for t,scale,zp in zip(s['tensors'],[.5,.5,2**-16],[-100,-100,0]):
 assert t['type'] in ('INT8',9) and t['shape']==[4]
 assert t['quantization']['scale']==[scale] and t['quantization']['zero_point']==[zp]
print('GENUINE_TFLITE_FLATBUFFER_ROUNDTRIP_PASS bytes',len(b))
PY
sha256sum results/model/quantized_mul_adversarial.tflite >> results/model/model_sources_sha256.txt
printf 'BUILD_OFFICIAL_TFLM_LIBRARY\n'
set +e
(cd tflm && make -f tensorflow/lite/micro/tools/make/Makefile -j4 microlite) > results/model/tflm_make.log 2>&1
rc=$?
set -e
if [[ $rc -ne 0 ]];then tail -90 results/model/tflm_make.log; echo "TFLM_LIBRARY_BUILD_FAILED=$rc";exit 31;fi
find tflm -name 'libtensorflow-microlite.a' -print | tee results/model/archive_path.txt
LIB=$(head -1 results/model/archive_path.txt)
[[ -f "$LIB" ]]
DL=tflm/tensorflow/lite/micro/tools/make/downloads
printf 'COMPILE_MODEL_INTERPRETER_WITH_OFFICIAL_LIBRARY\n'
g++ -std=c++17 -O2 -I tflm -I "$DL" -I "$DL/flatbuffers/include" -I "$DL/gemmlowp" -I "$DL/kissfft" -I "$DL/ruy" model/interpreter_run.cc "$LIB" -lm -pthread -o results/model/run_real_tflm
set +e
results/model/run_real_tflm results/model/quantized_mul_adversarial.tflite >results/model/interpreter_output.log 2>&1
rc=$?
set -e
cat results/model/interpreter_output.log
printf 'INTERPRETER_EXIT=%s\n' "$rc" | tee results/model/interpreter_exit.txt
[[ $rc -eq 0 ]]
grep -Fq 'ACTUAL_TFLM_MUL_PREPARE m=1073741824 shift=15 offsets=100,100,0 activation=-128,127' results/model/interpreter_output.log
grep -Fq 'ACTUAL_TFLM_REFERENCE_INVOKE_OUTPUT 127 127 127 127' results/model/interpreter_output.log
grep -Fq 'ACTUAL_TFLM_MODEL_PREPARE_AND_REFERENCE_INVOKE_PASS' results/model/interpreter_output.log
printf 'G3_GENUINE_MODEL_REAL_PREPARE_PASS\n'