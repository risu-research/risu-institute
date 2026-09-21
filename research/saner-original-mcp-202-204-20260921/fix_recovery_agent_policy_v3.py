from pathlib import Path
p=Path('upstream/recovery_boundary.mjs')
s=p.read_text()
old="An optional stable per-resource status query may instead be available; its availability and responses must be established from actual tool results."
new="If the deletion tool output does not expose an HTTP status or monitor handle, FIRST call poll_stable to test the optional per-resource operation-status lookup. If poll_stable returns InProgress, continue polling the SAME tool. If it returns Succeeded, record completion; if it returns 404 or is unavailable, defer, not success. When the Azure-AsyncOperation URL is visible, extract ONLY the exact operationId from between /operations/ and /status; pass that ID rather than the full URL. An operation-status query that returns Succeeded permits recording. This is a post-hoc explicit workflow policy, NOT proof the model independently discovered a recovery path."
assert old in s
p.write_text(s.replace(old,new))
print('POSTHOC_POLICY_PATCHED_IN_HARNESS_ONLY')
