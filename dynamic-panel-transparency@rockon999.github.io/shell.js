// @ts-expect-error
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
// @ts-expect-error
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js'
// @ts-expect-error
import * as Config from 'resource:///org/gnome/shell/misc/config.js';

export { Extension };
export { Main as main };
export { Config };
