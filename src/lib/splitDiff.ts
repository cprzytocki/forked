import type { DiffLine, DiffHunk } from "@/lib/types";

export interface SplitDiffRow {
  left: DiffLine | null;
  right: DiffLine | null;
}

export interface SplitHunk {
  header: string;
  old_start: number;
  old_lines: number;
  new_start: number;
  new_lines: number;
  rows: SplitDiffRow[];
}

export function splitDiffHunks(hunks: DiffHunk[]): SplitHunk[] {
  return hunks.map((hunk) => ({
    header: hunk.header,
    old_start: hunk.old_start,
    old_lines: hunk.old_lines,
    new_start: hunk.new_start,
    new_lines: hunk.new_lines,
    rows: pairLines(hunk.lines),
  }));
}

function pairLines(lines: DiffLine[]): SplitDiffRow[] {
  const rows: SplitDiffRow[] = [];
  let delBuffer: DiffLine[] = [];
  let addBuffer: DiffLine[] = [];

  const flush = () => {
    const maxLen = Math.max(delBuffer.length, addBuffer.length);
    for (let i = 0; i < maxLen; i++) {
      rows.push({
        left: i < delBuffer.length ? delBuffer[i] : null,
        right: i < addBuffer.length ? addBuffer[i] : null,
      });
    }
    delBuffer = [];
    addBuffer = [];
  };

  for (const line of lines) {
    if (line.origin === "-") {
      delBuffer.push(line);
    } else if (line.origin === "+") {
      addBuffer.push(line);
    } else {
      flush();
      rows.push({ left: line, right: line });
    }
  }

  flush();
  return rows;
}
