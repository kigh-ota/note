// @flow
import {AppModes} from '../constants/AppConstants';

export type AppModeType = $Keys<typeof AppModes>;

export type Note = {
    title: string,
    content: string,
};
