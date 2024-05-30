/** @typedef {import('./main.js').DptExtension} DptExtension */

import { DptExtension } from './main.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

export default class ExtensionWrapper extends Extension {
    /** @type {DptExtension | null} */
    extension = null;

    enable() {
        try {
            this.extension = new DptExtension();
            this.extension.enable();
        } catch (error) {
            logError(error);
            log('[Dynamic Panel Transparency] Failed to enable.');
        }
    }

    disable() {
        try {
            if (this.extension) {
                this.extension.disable();
                this.extension = null;
            }
        } catch (error) {
            logError(error);
            log('[Dynamic Panel Transparency] Failed to disable.');
        }
    }
}
