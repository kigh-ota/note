// @flow
import type {AppModeType} from '../types/AppTypes';
import {AppModes} from '../components/AppConstants';

export default class AppUtil {
    static getAppMode(): AppModeType {
        if (process.env.hasOwnProperty(AppModes.TEST)) {
            return AppModes.TEST;
        }
        if (process.env.hasOwnProperty(AppModes.DEVELOPMENT)) {
            return AppModes.DEVELOPMENT;
        }
        return AppModes.PRODUCTION;
    }
}