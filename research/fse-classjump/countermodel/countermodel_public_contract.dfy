include "BackendContract.dfy"

// Semantic countermodel to the old public Backend.Copy contract from
// haalfi/remote-store PR #664 base.  The old public success postcondition
// requires destination existence and content equality, but does not require
// metadata equality.  This lemma constructs an explicit state pair satisfying
// those visible success facts while losing nonempty source metadata.
lemma OldPublicCopyContractAllowsMetadataLoss()
  ensures exists oldFs: Filesystem, newFs: Filesystem, src: Path, dst: Path, r: Result<()> ::
    IsFile(oldFs, src) &&
    !IsDir(oldFs, dst) &&
    !IsFile(oldFs, dst) &&
    r.Ok? &&
    IsFile(newFs, src) &&
    IsFile(newFs, dst) &&
    newFs[dst].content == oldFs[src].content &&
    newFs[dst].info.metadata != oldFs[src].info.metadata
{
  var src: Path := "src";
  var dst: Path := "dst";
  var md: map<string, string> := map["k" := "v"];
  var srcInfo := FileInfo(src, src, 1, None, None, None, Some(md));
  var oldFs: Filesystem := map[src := FileEntry([42], srcInfo)];
  var newInfo := BasicFileInfo(dst, dst, 1);
  var newFs: Filesystem := oldFs[dst := FileEntry(oldFs[src].content, newInfo)];
  var r: Result<()> := Ok(());

  assert IsFile(oldFs, src);
  assert !IsDir(oldFs, dst);
  assert !IsFile(oldFs, dst);
  assert r.Ok?;
  assert IsFile(newFs, src);
  assert IsFile(newFs, dst);
  assert newFs[dst].content == oldFs[src].content;
  assert oldFs[src].info.metadata == Some(md);
  assert newFs[dst].info.metadata == None;
  assert newFs[dst].info.metadata != oldFs[src].info.metadata;

  assert exists oldFs2: Filesystem, newFs2: Filesystem, src2: Path, dst2: Path, r2: Result<()> ::
    IsFile(oldFs2, src2) &&
    !IsDir(oldFs2, dst2) &&
    !IsFile(oldFs2, dst2) &&
    r2.Ok? &&
    IsFile(newFs2, src2) &&
    IsFile(newFs2, dst2) &&
    newFs2[dst2].content == oldFs2[src2].content &&
    newFs2[dst2].info.metadata != oldFs2[src2].info.metadata;
}
