import { indentSelection } from "@codemirror/commands";
import type { EditorView } from "@codemirror/view";

/** Width of a line's leading whitespace. */
function indentWidth(text: string): number {
  return /^[ \t]*/.exec(text)?.[0].length ?? 0;
}

/**
 * Re-indent the whole document with the open language's indentation rules,
 * leaving the cursor on the same character. This is CodeMirror's indenter,
 * not a pretty-printer: it rewrites leading whitespace and leaves the rest of
 * each line alone, in a single transaction that one undo reverses.
 */
export function formatDocument(view: EditorView): void {
  const { doc, selection } = view.state;
  const before = doc.lineAt(selection.main.head);
  const line = before.number;
  const column = Math.max(
    0,
    selection.main.head - before.from - indentWidth(before.text),
  );

  // indentSelection only touches selected lines, and re-indenting never
  // changes the line count — so select everything, indent, then put the
  // cursor back by line and offset from the first non-blank character.
  view.dispatch({ selection: { anchor: 0, head: doc.length } });
  indentSelection({ state: view.state, dispatch: (tr) => view.dispatch(tr) });

  const after = view.state.doc.line(line);
  view.dispatch({
    selection: {
      anchor: Math.min(after.from + indentWidth(after.text) + column, after.to),
    },
    scrollIntoView: true,
  });
  view.focus();
}
