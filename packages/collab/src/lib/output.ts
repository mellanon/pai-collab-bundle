/**
 * Output formatting utilities.
 * JSON by default, --pretty for human-readable.
 */

export interface OutputOptions {
  pretty?: boolean;
}

/**
 * Output data as JSON (default) or pretty-printed table.
 */
export function output(data: unknown, opts: OutputOptions = {}): void {
  if (opts.pretty) {
    // Pretty mode: format for human reading
    if (Array.isArray(data)) {
      console.table(data);
    } else {
      console.log(JSON.stringify(data, null, 2));
    }
  } else {
    // JSON mode (default): machine-readable
    console.log(JSON.stringify(data));
  }
}
