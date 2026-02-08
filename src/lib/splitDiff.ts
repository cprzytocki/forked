import type { DiffHunk, DiffLine } from '@/lib/types';

export interface InlineSegment {
  text: string;
  highlighted: boolean;
}

export interface SplitDiffRow {
  left: DiffLine | null;
  right: DiffLine | null;
  leftSegments?: InlineSegment[];
  rightSegments?: InlineSegment[];
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

function computeInlineSegments(
  oldText: string,
  newText: string,
): [InlineSegment[], InlineSegment[]] {
  // Find common prefix
  let prefix = 0;
  while (
    prefix < oldText.length &&
    prefix < newText.length &&
    oldText[prefix] === newText[prefix]
  ) {
    prefix++;
  }

  // Find common suffix (not overlapping with prefix)
  let suffix = 0;
  while (
    suffix < oldText.length - prefix &&
    suffix < newText.length - prefix &&
    oldText[oldText.length - 1 - suffix] ===
      newText[newText.length - 1 - suffix]
  ) {
    suffix++;
  }

  const oldSegs: InlineSegment[] = [];
  const newSegs: InlineSegment[] = [];

  if (prefix > 0) {
    oldSegs.push({ text: oldText.slice(0, prefix), highlighted: false });
    newSegs.push({ text: newText.slice(0, prefix), highlighted: false });
  }

  const oldMid = oldText.slice(prefix, oldText.length - suffix);
  const newMid = newText.slice(prefix, newText.length - suffix);

  if (oldMid) {
    oldSegs.push({ text: oldMid, highlighted: true });
  }
  if (newMid) {
    newSegs.push({ text: newMid, highlighted: true });
  }

  if (suffix > 0) {
    oldSegs.push({
      text: oldText.slice(oldText.length - suffix),
      highlighted: false,
    });
    newSegs.push({
      text: newText.slice(newText.length - suffix),
      highlighted: false,
    });
  }

  return [oldSegs, newSegs];
}

function pairLines(lines: DiffLine[]): SplitDiffRow[] {
  const rows: SplitDiffRow[] = [];
  let delBuffer: DiffLine[] = [];
  let addBuffer: DiffLine[] = [];

  const flush = () => {
    const maxLen = Math.max(delBuffer.length, addBuffer.length);
    for (let i = 0; i < maxLen; i++) {
      const left = i < delBuffer.length ? delBuffer[i] : null;
      const right = i < addBuffer.length ? addBuffer[i] : null;
      const row: SplitDiffRow = { left, right };

      if (left && right) {
        const [leftSegs, rightSegs] = computeInlineSegments(
          left.content,
          right.content,
        );
        row.leftSegments = leftSegs;
        row.rightSegments = rightSegs;
      }

      rows.push(row);
    }
    delBuffer = [];
    addBuffer = [];
  };

  for (const line of lines) {
    if (line.origin === '-') {
      delBuffer.push(line);
    } else if (line.origin === '+') {
      addBuffer.push(line);
    } else {
      flush();
      rows.push({ left: line, right: line });
    }
  }

  flush();
  return rows;
}
