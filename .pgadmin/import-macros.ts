/** Local Deno importer for the Compose pgAdmin 9.17 settings database. */
interface Macro {
  name: string;
  sql: string;
  alt: number;
  control: number;
  key_code: number;
}

interface MacroDefinition extends Omit<Macro, "sql"> {
  file: string;
}

interface Statement {
  sql: string;
  params: Record<string, string | number>;
  requireRow?: string;
}

export function parseManifest(value: unknown): MacroDefinition[] {
  if (!Array.isArray(value)) {
    throw new Error("macros.json must contain an array");
  }
  return value.map((macro: unknown, index) => {
    if (
      typeof macro !== "object" || macro === null ||
      !("name" in macro) || typeof macro.name !== "string" ||
      !macro.name.trim() ||
      !("file" in macro) || typeof macro.file !== "string" ||
      !/^[a-zA-Z0-9_-]+\.sql$/.test(macro.file) ||
      !("alt" in macro) || (macro.alt !== 0 && macro.alt !== 1) ||
      !("control" in macro) || (macro.control !== 0 && macro.control !== 1) ||
      !("key_code" in macro) || typeof macro.key_code !== "number" ||
      !Number.isInteger(macro.key_code)
    ) {
      throw new Error(`Invalid macro at index ${index}`);
    }
    return {
      name: macro.name,
      file: macro.file,
      alt: macro.alt,
      control: macro.control,
      key_code: macro.key_code,
    };
  });
}

export async function loadMacros(directory: URL): Promise<Macro[]> {
  const definitions = parseManifest(
    JSON.parse(await Deno.readTextFile(new URL("macros.json", directory))),
  );
  return await Promise.all(definitions.map(async ({ file, ...macro }) => {
    const sql = await Deno.readTextFile(new URL(file, directory));
    if (!sql.trim()) throw new Error(`Macro SQL file is empty: ${file}`);
    return { ...macro, sql };
  }));
}

export function buildStatements(macros: Macro[]): Statement[] {
  const statements: Statement[] = [{
    sql: "SELECT id FROM user WHERE email=:email",
    params: {},
    requireRow: "pgAdmin default user not found; finish starting pgAdmin first",
  }];
  // These fragments are constant SQL. All macro contents are bound parameters.
  const userId = "(SELECT id FROM user WHERE email=:email)";
  const shortcutId = `(SELECT id FROM macros
    WHERE alt=:alt AND control=:control AND key_code=:key_code)`;
  for (const macro of macros) {
    const params = { ...macro };
    statements.push({
      sql: `SELECT id FROM macros
        WHERE alt=:alt AND control=:control AND key_code=:key_code`,
      params,
      requireRow: `Unknown shortcut for ${macro.name}`,
    }, {
      sql: `SELECT CASE
        WHEN NOT EXISTS (SELECT 1 FROM user_macros
          WHERE uid=${userId} AND mid=${shortcutId}) THEN 'Added'
        WHEN (SELECT count(*) FROM user_macros
          WHERE uid=${userId} AND mid=${shortcutId}) = 1
          AND EXISTS (SELECT 1 FROM user_macros
            WHERE uid=${userId} AND mid=${shortcutId}
              AND name=:name AND sql=:sql) THEN 'Already installed'
        ELSE 'Updated'
        END || ': ' || :name AS message`,
      params,
    }, {
      sql: `UPDATE user_macros SET name=:name, sql=:sql
        WHERE uid=${userId} AND mid=${shortcutId}`,
      params,
    }, {
      sql: `INSERT INTO user_macros (uid, mid, name, sql)
        SELECT ${userId}, ${shortcutId}, :name, :sql
        WHERE NOT EXISTS (SELECT 1 FROM user_macros
          WHERE uid=${userId} AND mid=${shortcutId})`,
      params,
    });
  }
  return statements;
}

// pgAdmin already ships Python + SQLite. This bridge executes a parameterized
// transaction in place; no packages, database copies, or Deno container needed.
export const sqliteBridge = String.raw`
import json, os, sqlite3, sys
from urllib.request import urlopen

with urlopen('http://127.0.0.1:80/misc/ping', timeout=5) as response:
    if response.status != 200:
        raise RuntimeError('pgAdmin is not ready; retry once startup completes')

statements = json.load(sys.stdin)
connection = sqlite3.connect(
    'file:/var/lib/pgadmin/pgadmin4.db?mode=rw', uri=True, timeout=30)
connection.row_factory = sqlite3.Row
messages = []
try:
    connection.execute('PRAGMA foreign_keys=ON')
    with connection:
        connection.execute('BEGIN IMMEDIATE')
        for statement in statements:
            params = dict(statement['params'], email=os.environ['PGADMIN_DEFAULT_EMAIL'])
            rows = connection.execute(statement['sql'], params).fetchall()
            if statement.get('requireRow') and not rows:
                raise RuntimeError(statement['requireRow'])
            messages.extend(row['message'] for row in rows if 'message' in row.keys())
    for message in messages:
        print(message)
finally:
    connection.close()
`;

async function main() {
  const directory = new URL("./", import.meta.url);
  const macros = await loadMacros(new URL("macros/", directory));
  const child = new Deno.Command("docker", {
    cwd: directory,
    args: [
      "compose",
      "-f",
      "../compose.yaml",
      "exec",
      "-T",
      "--user",
      "5050:5050",
      "pgadmin",
      "/venv/bin/python3",
      "-c",
      sqliteBridge,
    ],
    stdin: "piped",
    stdout: "inherit",
    stderr: "inherit",
  }).spawn();
  const writer = child.stdin.getWriter();
  try {
    await writer.write(
      new TextEncoder().encode(JSON.stringify(buildStatements(macros))),
    );
    await writer.close();
  } catch (error) {
    await child.status;
    throw error;
  }
  if (!(await child.status).success) {
    throw new Error(
      "Import failed. Ensure Docker and Compose pgAdmin are running and ready.",
    );
  }
  console.log(
    "Import complete. Refresh the pgAdmin Query Tool to load the macros.",
  );
}

if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    Deno.exit(1);
  }
}
