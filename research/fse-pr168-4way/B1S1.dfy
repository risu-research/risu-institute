// Historical source: dafny-lang/libraries PR #168
// B1 = new Deserializer boundary predicate: |str| < start + 6
// S1 = new JSON.Spec EscapeUnicode padding: seq(4 - |s|, _ => '0') + s
module PR168_B1S1 {
  function BoundaryAccepts(str: seq<int>, start: nat): bool {
    if |str| < start + 6 then false else true
  }

  function EscapeUnicodeWitness(): seq<char> {
    var s := ['7'];
    seq(4 - |s|, _ => '0') + s
  }

  method HistoricalOracle() {
    assert BoundaryAccepts([0, 0, 0, 0, 0, 0], 0);
    assert EscapeUnicodeWitness() == ['0', '0', '0', '7'];
  }
}
