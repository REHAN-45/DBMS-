import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { SCHEMA_SQL, SEED_DATA_SQL } from './schema';
import { SqlLogEntry } from './types';

const STORAGE_KEY = 'campus_placement_sqlite_db_v1';
const SQL_LOG_STORAGE_KEY = 'campus_placement_sql_logs_v1';

type LogListener = (logs: SqlLogEntry[]) => void;
type DbChangeListener = () => void;

class SqliteService {
  private SQL: SqlJsStatic | null = null;
  private db: Database | null = null;
  private logs: SqlLogEntry[] = [];
  private logListeners: Set<LogListener> = new Set();
  private changeListeners: Set<DbChangeListener> = new Set();
  private initPromise: Promise<Database> | null = null;

  constructor() {
    this.loadLogsFromStorage();
  }

  private loadLogsFromStorage() {
    try {
      const stored = localStorage.getItem(SQL_LOG_STORAGE_KEY);
      if (stored) {
        this.logs = JSON.parse(stored).slice(0, 50);
      }
    } catch (e) {
      console.warn('Could not restore logs from storage', e);
    }
  }

  private saveLogsToStorage() {
    try {
      localStorage.setItem(SQL_LOG_STORAGE_KEY, JSON.stringify(this.logs.slice(0, 50)));
    } catch {
      // Ignore quota error if storage is full
    }
  }

  public subscribeLogs(listener: LogListener): () => void {
    this.logListeners.add(listener);
    listener([...this.logs]);
    return () => this.logListeners.delete(listener);
  }

  public subscribeDbChange(listener: DbChangeListener): () => void {
    this.changeListeners.add(listener);
    return () => this.changeListeners.delete(listener);
  }

  private notifyDbChange() {
    this.changeListeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('DbChangeListener error:', err);
      }
    });
  }

  private addLog(entry: Omit<SqlLogEntry, 'id' | 'timestamp'>) {
    const fullEntry: SqlLogEntry = {
      ...entry,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
    };
    this.logs.unshift(fullEntry);
    if (this.logs.length > 100) {
      this.logs.pop();
    }
    this.saveLogsToStorage();
    this.logListeners.forEach((l) => l([...this.logs]));
  }

  public clearLogs() {
    this.logs = [];
    this.saveLogsToStorage();
    this.logListeners.forEach((l) => l([]));
  }

  public getLogs(): SqlLogEntry[] {
    return [...this.logs];
  }

  public async getDb(): Promise<Database> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      const sqlStart = performance.now();
      try {
        this.SQL = await initSqlJs({
          locateFile: (file) => {
            if (file.endsWith('.wasm')) {
              return wasmUrl || `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/${file}`;
            }
            return file;
          },
        });
      } catch {
        // Fallback to CDN if Vite relative wasm fails
        this.SQL = await initSqlJs({
          locateFile: () => 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/sql-wasm.wasm',
        });
      }

      // Check if we have saved DB binary in localStorage
      const savedDbBase64 = localStorage.getItem(STORAGE_KEY);
      if (savedDbBase64) {
        try {
          const binary = Uint8Array.from(atob(savedDbBase64), (c) => c.charCodeAt(0));
          this.db = new this.SQL.Database(binary);
          // Enable PRAGMA foreign keys
          this.db.run('PRAGMA foreign_keys = ON;');
          this.addLog({
            sql: 'PRAGMA foreign_keys = ON; -- Restored existing SQLite DB from local browser storage',
            durationMs: Math.round(performance.now() - sqlStart),
            type: 'PRAGMA',
          });
          return this.db;
        } catch (err) {
          console.warn('Failed to load saved SQLite database, creating fresh one:', err);
        }
      }

      // Fresh Database initialization
      this.db = new this.SQL.Database();
      this.db.run('PRAGMA foreign_keys = ON;');
      this.db.run(SCHEMA_SQL);
      this.db.run(SEED_DATA_SQL);
      this.saveToStorage();

      this.addLog({
        sql: '-- Database Initialized with 3NF Schema & Sample Indian College Placement Seeds\nPRAGMA foreign_keys = ON;',
        durationMs: Math.round(performance.now() - sqlStart),
        type: 'DDL',
      });

      return this.db;
    })();

    return this.initPromise;
  }

  public saveToStorage(): void {
    if (!this.db) return;
    try {
      const data = this.db.export();
      let binaryStr = '';
      const len = data.byteLength;
      for (let i = 0; i < len; i++) {
        binaryStr += String.fromCharCode(data[i]);
      }
      const base64 = btoa(binaryStr);
      localStorage.setItem(STORAGE_KEY, base64);
    } catch (e) {
      console.warn('Failed to persist SQLite DB to localStorage:', e);
    }
  }

  public async resetDatabase(): Promise<void> {
    const start = performance.now();
    localStorage.removeItem(STORAGE_KEY);
    if (!this.SQL) {
      await this.getDb();
    }
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.initPromise = null;
    await this.getDb();
    this.addLog({
      sql: '-- Reset Database Executed: All tables dropped and fresh 3NF schema re-seeded',
      durationMs: Math.round(performance.now() - start),
      type: 'DDL',
    });
    this.notifyDbChange();
  }

  public async execute(sql: string, params?: any[]): Promise<{ rowsAffected: number; lastInsertId: number }> {
    const db = await this.getDb();
    const start = performance.now();
    const cleanSql = sql.trim();
    const firstWord = cleanSql.split(/\s+/)[0]?.toUpperCase() || 'OTHER';

    const type: SqlLogEntry['type'] =
      firstWord === 'SELECT'
        ? 'SELECT'
        : firstWord === 'INSERT'
        ? 'INSERT'
        : firstWord === 'UPDATE'
        ? 'UPDATE'
        : firstWord === 'DELETE'
        ? 'DELETE'
        : ['CREATE', 'ALTER', 'DROP'].includes(firstWord)
        ? 'DDL'
        : firstWord === 'PRAGMA'
        ? 'PRAGMA'
        : 'OTHER';

    try {
      if (params && params.length > 0) {
        db.run(cleanSql, params);
      } else {
        db.run(cleanSql);
      }
      const durationMs = Math.round((performance.now() - start) * 100) / 100;
      const rowsAffected = db.getRowsModified();
      
      // Get last insert rowid if it was an insert
      let lastInsertId = 0;
      if (type === 'INSERT') {
        const idRes = db.exec('SELECT last_insert_rowid() AS id;');
        if (idRes.length > 0 && idRes[0].values.length > 0) {
          lastInsertId = Number(idRes[0].values[0][0]);
        }
      }

      this.addLog({
        sql: cleanSql,
        durationMs,
        rowsAffected,
        type,
      });

      this.saveToStorage();
      this.notifyDbChange();

      return { rowsAffected, lastInsertId };
    } catch (err: any) {
      const durationMs = Math.round((performance.now() - start) * 100) / 100;
      const errorMsg = err?.message || String(err);
      this.addLog({
        sql: cleanSql,
        durationMs,
        error: errorMsg,
        type,
      });
      throw err;
    }
  }

  public async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const db = await this.getDb();
    const start = performance.now();
    const cleanSql = sql.trim();

    try {
      const res = params && params.length > 0 ? db.exec(cleanSql, params) : db.exec(cleanSql);
      const durationMs = Math.round((performance.now() - start) * 100) / 100;

      if (!res || res.length === 0) {
        this.addLog({
          sql: cleanSql,
          durationMs,
          rowsAffected: 0,
          type: 'SELECT',
        });
        return [];
      }

      const { columns, values } = res[0];
      const rows: T[] = values.map((valRow) => {
        const obj: any = {};
        columns.forEach((col, idx) => {
          obj[col] = valRow[idx];
        });
        return obj as T;
      });

      this.addLog({
        sql: cleanSql,
        durationMs,
        rowsAffected: rows.length,
        type: 'SELECT',
      });

      return rows;
    } catch (err: any) {
      const durationMs = Math.round((performance.now() - start) * 100) / 100;
      const errorMsg = err?.message || String(err);
      this.addLog({
        sql: cleanSql,
        durationMs,
        error: errorMsg,
        type: 'SELECT',
      });
      throw err;
    }
  }

  public async rawExec(sql: string): Promise<{ columns: string[]; values: any[][] }[]> {
    const db = await this.getDb();
    const start = performance.now();
    const cleanSql = sql.trim();
    const firstWord = cleanSql.split(/\s+/)[0]?.toUpperCase() || 'OTHER';

    try {
      const res = db.exec(cleanSql);
      const durationMs = Math.round((performance.now() - start) * 100) / 100;
      const totalRows = res.reduce((acc, r) => acc + (r.values?.length || 0), 0);

      this.addLog({
        sql: cleanSql,
        durationMs,
        rowsAffected: totalRows,
        type: ['CREATE', 'ALTER', 'DROP'].includes(firstWord)
          ? 'DDL'
          : firstWord === 'SELECT'
          ? 'SELECT'
          : 'OTHER',
      });

      if (['INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP'].includes(firstWord)) {
        this.saveToStorage();
        this.notifyDbChange();
      }

      return res;
    } catch (err: any) {
      const durationMs = Math.round((performance.now() - start) * 100) / 100;
      const errorMsg = err?.message || String(err);
      this.addLog({
        sql: cleanSql,
        durationMs,
        error: errorMsg,
        type: 'OTHER',
      });
      throw err;
    }
  }

  public exportDatabaseFile(): void {
    if (!this.db) return;
    const binary = this.db.export();
    const blob = new Blob([binary as unknown as BlobPart], { type: 'application/x-sqlite3' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `college_placement_${new Date().toISOString().split('T')[0]}.sqlite`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Translates cryptic SQLite error messages into clear, examiner-friendly explanations.
   */
  public formatDbError(err: any): string {
    const raw = String(err?.message || err || 'Unknown database error');
    if (raw.includes('FOREIGN KEY constraint failed')) {
      return 'Relational Integrity Error (FOREIGN KEY Violation): This record cannot be deleted or modified because it is referenced as a Foreign Key in child tables (e.g. Jobs, Applications, or Offers). In DBMS, ON DELETE RESTRICT prevents accidental orphan data.';
    }
    if (raw.includes('UNIQUE constraint failed')) {
      const match = raw.match(/UNIQUE constraint failed:\s*(.*)/);
      const cols = match ? match[1] : 'attribute';
      return `Candidate Key Violation (UNIQUE Constraint Failed): A record with this unique value (${cols}) already exists. Duplicate entries violate entity uniqueness.`;
    }
    if (raw.includes('CHECK constraint failed')) {
      return 'Domain Integrity Violation (CHECK Constraint Failed): One or more submitted values failed table domain constraints (e.g., CGPA must be between 0.0 and 10.0, Package LPA must be > 0, or Backlogs must be >= 0).';
    }
    if (raw.includes('NOT NULL constraint failed')) {
      return 'Entity Integrity Violation (NOT NULL Constraint): A required mandatory attribute was left blank.';
    }
    return raw;
  }
}

export const sqliteService = new SqliteService();
