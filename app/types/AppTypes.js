// @flow
import {AppModes} from '../constants/AppConstants';

export type AppModeType = $Keys<typeof AppModes>;

export type NoteId = number;

export type Note = {
    id?: NoteId,
    title: string,
    content: string,
    dtCreated?: string,
    dtUpdated?: string,
};

export type SavedNote = {
    id: NoteId,
    title: string,
    content: string,
    dtCreated: string,
    dtUpdated: string,
}
