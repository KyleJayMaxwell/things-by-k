// src/lib/fieldErrors.ts
// Works out which column a failed Supabase save was about, so a form can point at that field
// instead of only showing the raw database message

// The SQL file in supabase/ that adds each column added after schema.sql
const COLUMN_MIGRATIONS: Record<string, string> = {
  locations: 'product-filters.sql',
  orientation: 'product-filters.sql',
  search_text: 'product-filters.sql',
  handwritten_price: 'handwritten-option.sql',
  carrier: 'order-tracking.sql',
  tracking_number: 'order-tracking.sql',
}

export interface DbFieldError {
  column: string
  // What went wrong, written for the admin rather than for a developer
  message: string
}

// Returns null when the error doesn't name a column (network trouble, permissions, and so on)
export function dbFieldError(err: unknown, table: string): DbFieldError | null {
  if (!err || typeof err !== 'object') return null
  const { code, message = '', details = '' } = err as { code?: string; message?: string; details?: string }
  let match: RegExpMatchArray | null

  // PGRST204: the column doesn't exist yet, usually because a migration hasn't been run
  if ((match = message.match(/Could not find the '(\w+)' column/))) {
    const column = match[1]
    const file = COLUMN_MIGRATIONS[column]
    return {
      column,
      message: file
        ? `The database isn’t set up for this field yet. Run supabase/${file} in the Supabase SQL editor, then save again.`
        : `The database has no “${column}” column yet, so this field can’t be saved.`,
    }
  }

  // 23505: duplicate value in a unique column, e.g. "Key (slug)=(bay-bridge) already exists."
  if (code === '23505' && (match = details.match(/^Key \((\w+)\)/))) {
    return { column: match[1], message: 'Another item already uses this. Pick a different one.' }
  }

  // 23502: 'null value in column "name" of relation "products" violates not-null constraint'
  if (code === '23502' && (match = message.match(/column "(\w+)"/))) {
    return { column: match[1], message: 'This can’t be empty.' }
  }

  // 23514: check constraints are named <table>_<column>_check unless named by hand
  if (code === '23514' && (match = message.match(/check constraint "(\w+)"/))) {
    const column = match[1].replace(new RegExp(`^${table}_`), '').replace(/_check$/, '')
    return { column, message: 'That value isn’t allowed here.' }
  }

  return null
}
