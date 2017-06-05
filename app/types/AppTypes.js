// @flow
import {AppModes} from '../constants/AppConstants';

export type AppModeType = $Keys<typeof AppModes>;

export type Note = {
    id?: number,
    title: string,
    content: string,
    dtCreated?: string,
    dtUpdated?: string,
};
