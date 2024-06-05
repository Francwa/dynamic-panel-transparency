/* exported init, enable, disable */

import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import * as Util from './util.js';

import { Events } from './events.js';
import { Intellifader } from './intellifade.js';
import { Settings } from './settings.js';
import { Theming } from './theming.js';
import { Transitions } from './transitions.js';

import { main } from './shell.js';
import { setTimeout } from './timers.js';

const SETTINGS_DELAY = 500;

export class DptExtension {
    constructor() {
        this.settings = new Settings();

        this.transitions = new Transitions(this);
        this.theming = new Theming(this);
        this.intellifader = new Intellifader(this);
        this.events = new Events(this);
    }

    enable() {
        /* Initialize settings */
        this.initializeSettings();

        this.theming.setup();

        /* Modify the panel. */
        this.modifyPanel();

        /* Start the event loop. */
        this.events.bind();

        /* Simulate window changes. */
        this.intellifader.forceSyncCheck();
    }

    disable() {
        const { settings, events, theming, transitions, intellifader } = this;
        /* Do this first in case any of the upcoming methods fail. */
        this.unmodify_panel();

        try {
            /* Disconnect & Null Signals */
            events.cleanup();

            /* Cleanup settings */
            settings.unbind();
            settings.cleanup();

            /* Cleanup Transitions */
            transitions.cleanup();

            /* Cleanup theming */
            theming.cleanup();

            /* Cleanup Intellifade */
            intellifader.cleanup();
        } catch (error) {
            log('[DPT] Encountered an error cleaning up extension: ' + error);
        }
    }

    modifyPanel() {
        const { theming, settings } = this;

        /* Get Rid of the Panel's CSS Background */
        theming.initialize_background_styles();

        let text_shadow = theming.register_text_shadow(
            settings.get_text_shadow_color(),
            settings.get_text_shadow_position()
        );
        let icon_shadow = theming.register_icon_shadow(
            settings.get_icon_shadow_color(),
            settings.get_icon_shadow_position()
        );

        /* Add Text Shadowing */
        if (settings.add_text_shadow()) {
            if (text_shadow !== null) {
                theming.add_text_shadow();
            } else {
                log('[Dynamic Panel Transparency] Failed to enabled text shadowing.');
            }
        }

        /* Add Icon Shadowing */
        if (settings.add_icon_shadow()) {
            if (icon_shadow !== null) {
                theming.add_icon_shadow();
            } else {
                log('[Dynamic Panel Transparency] Failed to enabled icon shadowing.');
            }
        }

        /* Register text color styling. */
        let [text] = theming.register_text_color(settings.get_text_color());
        theming.register_text_color(settings.get_maximized_text_color(), 'maximized');
        if (settings.get_enable_text_color()) {
            if (text !== null) {
                theming.set_text_color();
            } else {
                log('[Dynamic Panel Transparency] Failed to enabled text coloring.');
            }
        }
    }

    unmodify_panel() {
        const { theming } = this;

        /* Remove Our Styling */
        theming.reapply_panel_styling();
        theming.reapply_panel_background_image();

        theming.remove_panel_transparency();

        /* Remove shadowing */
        if (theming.has_text_shadow()) {
            theming.remove_text_shadow();
        }

        if (theming.has_icon_shadow()) {
            theming.remove_icon_shadow();
        }

        /* Remove text coloring */
        theming.remove_text_color();

        /* Remove maximized text coloring */
        theming.remove_text_color('maximized');
    }

    // TODO: Merge handler code or hide it behind the backend.
    initializeSettings() {
        const { settings, theming, intellifader } = this;

        /* Register settings... */
        settings.on('transition-speed', () => {
            main.panel.remove_style_class_name('dpt-panel-transition-duration');

            this._unloadAndRemoveStylesheet('transitions/panel-transition-duration');

            const id = (this.panel_transition_update_id = setTimeout(() => {
                if (id !== this.panel_transition_update_id) {
                    return;
                }

                /* Get Rid of the Panel's CSS */
                theming.update_transition_css();

                intellifader.forceSyncCheck();

                return;
            }, SETTINGS_DELAY));
        });
        settings.on('unmaximized-opacity', () => {
            const super_id = (this.opacity_update_id = setTimeout(() => {
                if (super_id !== this.opacity_update_id) {
                    return;
                }

                this._unloadAndRemoveStylesheet('background/panel-custom');

                theming.initialize_background_styles();

                const id = (this.panel_color_update_id = setTimeout(() => {
                    if (id !== this.panel_color_update_id) {
                        return;
                    }

                    /* Get Rid of the Panel's CSS Background */
                    theming.remove_background_color();

                    intellifader.forceSyncCheck();

                    return;
                }, SETTINGS_DELAY));

                return;
            }, SETTINGS_DELAY));
        });

        settings.on('maximized-opacity', () => {
            const super_id = (this.opacity_update_id = setTimeout(() => {
                if (super_id !== this.opacity_update_id) {
                    return;
                }

                this._unloadAndRemoveStylesheet('background/panel-custom');

                theming.initialize_background_styles();

                const id = (this.panel_color_update_id = setTimeout(() => {
                    if (id !== this.panel_color_update_id) {
                        return;
                    }

                    /* Get Rid of the Panel's CSS Background */
                    intellifader.forceSyncCheck();

                    return;
                }, SETTINGS_DELAY));

                return;
            }, SETTINGS_DELAY));
        });

        settings.on('text-shadow', () => {
            if (settings.add_text_shadow()) {
                theming.add_text_shadow();
            } else {
                theming.remove_text_shadow();
            }
        });

        settings.on('icon-shadow', () => {
            if (settings.add_icon_shadow()) {
                theming.add_icon_shadow();
            } else {
                theming.remove_icon_shadow();
            }
        });

        settings.on('text-shadow-position', () => {
            theming.remove_text_shadow();

            this._unloadAndRemoveStylesheet('foreground/panel-text-shadow');

            let text_shadow = theming.register_text_shadow(
                settings.get_text_shadow_color(),
                settings.get_text_shadow_position()
            );
            const id = (this.text_shadow_update_id = setTimeout(() => {
                if (id !== this.text_shadow_update_id) {
                    return;
                }

                /* Add Text Shadowing */
                if (settings.add_text_shadow()) {
                    if (text_shadow !== null) {
                        theming.add_text_shadow();
                    } else {
                        log('[Dynamic Panel Transparency] Failed to enabled text shadowing.');
                    }
                }

                intellifader.forceSyncCheck();

                return;
            }, SETTINGS_DELAY));
        });
        settings.on('icon-shadow-position', () => {
            theming.remove_icon_shadow();

            this._unloadAndRemoveStylesheet('foreground/panel-icon-shadow');

            let icon_shadow = theming.register_icon_shadow(
                settings.get_icon_shadow_color(),
                settings.get_icon_shadow_position()
            );
            const id = (this.icon_shadow_update_id = setTimeout(() => {
                if (id !== this.icon_shadow_update_id) {
                    return;
                }

                /* Add Icon Shadowing */
                if (settings.add_icon_shadow()) {
                    if (icon_shadow !== null) {
                        theming.add_icon_shadow();
                    } else {
                        log('[Dynamic Panel Transparency] Failed to enabled icon shadowing.');
                    }
                }

                intellifader.forceSyncCheck();

                return;
            }, SETTINGS_DELAY));
        });
        settings.on('icon-shadow-color', () => {
            theming.remove_icon_shadow();

            this._unloadAndRemoveStylesheet('foreground/panel-icon-shadow');

            let icon_shadow = theming.register_icon_shadow(
                settings.get_icon_shadow_color(),
                settings.get_icon_shadow_position()
            );
            const id = (this.icon_shadow_update_id = setTimeout(() => {
                if (id !== this.icon_shadow_update_id) {
                    return;
                }

                /* Add Icon Shadowing */
                if (settings.add_icon_shadow()) {
                    if (icon_shadow !== null) {
                        theming.add_icon_shadow();
                    } else {
                        log('[Dynamic Panel Transparency] Failed to enabled icon shadowing.');
                    }
                }

                intellifader.forceSyncCheck();

                return;
            }, SETTINGS_DELAY));
        });
        settings.on('text-shadow-color', () => {
            theming.remove_text_shadow();

            this._unloadAndRemoveStylesheet('foreground/panel-text-shadow');

            let text_shadow = theming.register_text_shadow(
                settings.get_text_shadow_color(),
                settings.get_text_shadow_position()
            );
            const id = (this.text_shadow_update_id = setTimeout(() => {
                if (id !== this.text_shadow_update_id) {
                    return;
                }

                /* Add Text Shadowing */
                if (settings.add_text_shadow()) {
                    if (text_shadow !== null) {
                        theming.add_text_shadow();
                    } else {
                        log('[Dynamic Panel Transparency] Failed to enabled text shadowing.');
                    }
                }

                intellifader.forceSyncCheck();

                return;
            }, SETTINGS_DELAY));
        });

        settings.on('enable-maximized-text-color', () => {
            intellifader.forceSyncCheck();
        });

        settings.on('enable-text-color', () => {
            if (settings.get_enable_text_color()) {
                intellifader.forceSyncCheck();
            } else {
                theming.remove_text_color();
                theming.remove_text_color('maximized');
            }
            intellifader.forceSyncCheck();
        });

        settings.on('text-color', () => {
            main.panel.remove_style_class_name('dpt-panel-text-color');

            this._unloadAndRemoveStylesheet('foreground/panel-text-color');

            const id = (this.text_color_update_id = setTimeout(() => {
                if (id !== this.text_color_update_id) {
                    return;
                }

                theming.remove_background_color();
                theming.register_text_color(settings.get_text_color());

                intellifader.forceSyncCheck();

                return;
            }, SETTINGS_DELAY));
        });

        settings.on('maximized-text-color', () => {
            main.panel.remove_style_class_name('dpt-panel-maximized-text-color');

            this._unloadAndRemoveStylesheet('foreground/panel-maximized-text-color');

            const id = (this.maximized_text_color_update_id = setTimeout(() => {
                if (id !== this.maximized_text_color_update_id) {
                    return;
                }

                theming.remove_maximized_background_color();
                theming.register_text_color(settings.get_maximized_text_color(), 'maximized');

                intellifader.forceSyncCheck();

                return;
            }, SETTINGS_DELAY));
        });

        settings.on('panel-color', () => {
            main.panel.remove_style_class_name('dpt-panel-color');

            this._unloadAndRemoveStylesheet('background/panel-custom');

            const id = (this.panel_color_update_id = setTimeout(() => {
                if (id !== this.panel_color_update_id) {
                    return;
                }

                theming.remove_background_color();
                theming.register_background_color(settings.get_panel_color(), 'custom');

                intellifader.forceSyncCheck();

                return;
            }, SETTINGS_DELAY));
        });

        settings.on('enable-background-color', () => {
            if (settings.enable_custom_background_color()) {
                intellifader.forceSyncCheck();
            } else {
                theming.remove_background_color();
            }
        });

        settings.on('enable-opacity', () => {
            if (settings.enable_custom_opacity()) {
                intellifader.forceSyncCheck();
            } else {
                theming.remove_opacity();
            }
        });
    }

    _unloadAndRemoveStylesheet(name) {
        let theme = St.ThemeContext.get_for_stage(global.stage).get_theme();

        for (let i = this.theming.stylesheets.length - 1; i >= 0; i--) {
            let stylesheet = this.theming.stylesheets[i];
            if (stylesheet.includes(name)) {
                theme.unload_stylesheet(Util.get_file(stylesheet));
                Util.remove_file(stylesheet);
                this.theming.stylesheets.splice(i, 1);
            }
        }
    }
}
