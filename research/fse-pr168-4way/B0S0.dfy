// Historical source: dafny-lang/libraries PR #168
// B0 = old Deserializer boundary predicate: |str| <= start + 6
// S0 = old JSON.Spec EscapeUnicode padding: s + seq(4 - |s|, _ => ' ')
module PR168_B0S0 {
  function BoundaryAccepts(str: seq<int>, start: nat): bool {
    if |str| <= start + 6 then false else true
  }

  function EscapeUnicodeWitness(): seq<char> {
    var s := ['7'];
    s + seq(4 - |s|, _ => ' ')
  }

  method HistoricalOracle() {
    assert BoundaryAccepts([0, 0, 0, 0, 0, 0], 0);
    assert EscapeUnicodeWitness() == ['0', '0', '0', '7'];
  }
}
