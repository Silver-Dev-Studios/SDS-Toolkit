/**
 * Minimal O(ND) Myers diff (with linear-space LCS fallback) tuned for
 * line-based text comparison in the Diff Viewer tool.
 */

function lcs(a, b) {
  const n = a.length, m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j]
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const ops = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { ops.push({ type: "eq", text: a[i] }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { ops.push({ type: "del", text: a[i] }); i++; }
    else { ops.push({ type: "add", text: b[j] }); j++; }
  }
  while (i < n) { ops.push({ type: "del", text: a[i] }); i++; }
  while (j < m) { ops.push({ type: "add", text: b[j] }); j++; }
  return ops;
}

export function diffLines(aText, bText) {
  const a = aText.replace(/\r\n/g, "\n").split("\n");
  const b = bText.replace(/\r\n/g, "\n").split("\n");
  return lcs(a, b);
}

export function diffStats(ops) {
  let add = 0, del = 0;
  for (const op of ops) {
    if (op.type === "add") add++;
    else if (op.type === "del") del++;
  }
  return { add, del, eq: ops.length - add - del };
}