// @flow
import db, {Statement} from 'sqlite';

const TABLE = 'notes';
const SQL = {
    CREATE_TABLE: 'CREATE TABLE IF NOT EXISTS ' + TABLE + ' (' +
        'id INTEGER PRIMARY KEY AUTOINCREMENT,' +
        'title TEXT NOT NULL,' +
        'content TEXT NOT NULL,' +
        'dtCreated TEXT NOT NULL,' + // ISO8601
        'dtUpdated TEXT NOT NULL,' +  // ISO8601
        'deleted BOOLEAN NOT NULL' +
        ')',
    CREATE_INDEX: 'CREATE INDEX IF NOT EXISTS titleIndex ON ' + TABLE + '(title)',
    INSERT: 'INSERT INTO ' + TABLE + ' ' +
        '(id, title, content, dtCreated, dtUpdated, deleted) ' +
        'VALUES(NULL, $title, $content, $dtCreated, $dtUpdated, 0)',
    UPDATE: 'UPDATE ' + TABLE + ' ' +
        'SET title=$title, content=$content, dtUpdated=$dtUpdated WHERE id=$id',
    DELETE: 'DELETE FROM ' + TABLE + ' WHERE id=$id',
    LOGICAL_DELETE: 'UPDATE ' + TABLE + ' ' +
        'SET deleted=1 WHERE id=$id',
    SELECT: 'SELECT * FROM ' + TABLE + ' WHERE id=$id',
    SELECT_ALL: 'SELECT * FROM ' + TABLE,
    SELECT_ALL_NOT_DELETED: 'SELECT * FROM ' + TABLE + ' WHERE deleted = 0',
};

export default class NoteRepository {
    static init(): Promise<void> {
        return this.createTable_().then(this.createIndex_);
    }

    static createTable_(): Promise<void> {
        return db.run(SQL.CREATE_TABLE);
    }

    static createIndex_(): Promise<void> {
        return db.run(SQL.CREATE_INDEX);
    }

    static select_(id: number): Promise<any> {
        return db.get(SQL.SELECT, {$id: id});
    }

    static selectAll_(): Promise<any[]> {
        return db.all(SQL.SELECT_ALL);
    }

    static selectAllNotDeleted_(): Promise<any[]> {
        return db.all(SQL.SELECT_ALL_NOT_DELETED);
    }

    static insert_(title: string, content: string): Promise<Statement> {
        const now: string = new Date().toISOString();
        return db.run(SQL.INSERT, {
            $title: title,
            $content: content,
            $dtCreated: now,
            $dtUpdated: now,
        });
    }

    static update_(id: number, title: string, content: string): Promise<Statement> {
        const now: string = new Date().toISOString();
        return db.run(SQL.UPDATE, {
            $id: id,
            $title: title,
            $content: content,
            $dtUpdated: now,
        });
    }

    static delete_(id: number): Promise<Statement> {
        return db.run(SQL.DELETE, {$id: id});
    }

    static deleteLogically_(id: number): Promise<Statement> {
        return db.run(SQL.LOGICAL_DELETE, {$id: id});
    }
}
