import Adw from 'gi://Adw';
import GLib from 'gi://GLib';
import Gdk from 'gi://Gdk';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import { setTimeout } from './timers.js';


class Color {
    static getRGBAFromSettings(settings, key) {
        let rgb_value = settings.get_value(key).deep_unpack();
        let rgba = new Gdk.RGBA();
        rgba.red = rgb_value[0] / 255;
        rgba.green = rgb_value[1] / 255;
        rgba.blue = rgb_value[2] / 255;
        rgba.alpha = 1;

        return rgba;
    }

    static saveRGBtoSettings(settings, key, rgba) {
        /* We have rgba in input but ignore the alpha value */
        let new_rgb_value = [
            Math.round(rgba.red * 255),
            Math.round(rgba.green * 255),
            Math.round(rgba.blue * 255)
        ];
        settings.set_value(key, new GLib.Variant('(iii)', new_rgb_value));
    }

    static saveRGBAtoSettings(settings, key, rgba, variant) {
        let new_rgb_value = [
            Math.round(rgba.red * 255),
            Math.round(rgba.green * 255),
            Math.round(rgba.blue * 255),
            rgba.alpha
        ];
        settings.set_value(key, new GLib.Variant(variant, new_rgb_value));
    }
}

class Position {
    static getFromSettings(settings, key) {
        let position = settings.get_value(key).deep_unpack();
        let x_offset = position[0];
        let y_offset = position[1];
        let radius = position[2];
        return [x_offset, y_offset, radius];
    }

    static saveToSettings(settings, key, position) {
        settings.set_value(key, new GLib.Variant('(iii)', position));
    }

}

export default class MyExtensionPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        let settings = this.getSettings();

        let UIFolderPath = this.dir.get_path();

        let builder = new Gtk.Builder();
        builder.add_from_file(UIFolderPath + '/prefs.ui');

        /* First tab: Transition */
        let page = builder.get_object('transition');

        let transition_speed_scale = builder.get_object('transition_speed_scale');
        transition_speed_scale.set_value(settings.get_int('transition-speed'));
        transition_speed_scale.add_mark(1000, Gtk.PositionType.BOTTOM, null);
        transition_speed_scale.connect('value-changed', (scale) => {
            const id = (this.transition_speed_timeout_id) = setTimeout(() => {
                if (this.transition_speed_update_id !== id) {
                    return;
                }
                settings.set_value('transition-speed', new GLib.Variant('i', scale.get_value()));
                return;
            }, 500);
        });

        let transition_windows_touch_check = builder.get_object('transition_windows_touch_check');
        transition_windows_touch_check.set_active(settings.get_boolean('transition-windows-touch'));
        transition_windows_touch_check.connect('state-set', (check) => {
            settings.set_value('transition-windows-touch', new GLib.Variant('b', check.get_active()));
        });

        let transition_with_overview_check = builder.get_object('transition_with_overview_check');
        transition_with_overview_check.set_active(settings.get_boolean('transition-with-overview'));
        transition_with_overview_check.connect('state-set', (check) => {
            settings.set_value('transition-with-overview', new GLib.Variant('b', check.get_active()));
        });

        /* Second tab: Foreground */
        let page2 = builder.get_object('foreground');

        let text_coloration_enable_check = builder.get_object('text_coloration_enable_check');
        text_coloration_enable_check.set_active(settings.get_boolean('enable-text-color'));
        text_coloration_enable_check.connect('state-set', (check) => {
            settings.set_value('enable-text-color', new GLib.Variant('b', check.get_active()));
        });

        let text_coloration_primary_color = builder.get_object('text_coloration_primary_color');
        text_coloration_primary_color.set_sensitive(text_coloration_enable_check.get_active());
        let text_coloration_primary_color_picker = builder.get_object('text_coloration_primary_color_picker');
        let maximized_text_color = Color.getRGBAFromSettings(settings, 'maximized-text-color');
        text_coloration_primary_color_picker.set_rgba(maximized_text_color);
        text_coloration_primary_color_picker.connect('notify::rgba', (check) => {
            Color.saveRGBtoSettings(settings, 'maximized-text-color', check.get_rgba());
        });

        let text_coloration_secondary_color = builder.get_object('text_coloration_secondary_color');
        text_coloration_secondary_color.set_sensitive(text_coloration_enable_check.get_active());
        let text_coloration_secondary_picker = builder.get_object('text_coloration_secondary_color_picker');
        let text_color = Color.getRGBAFromSettings(settings, 'text-color');
        text_coloration_secondary_picker.set_rgba(text_color);
        text_coloration_secondary_picker.connect('notify::rgba', (check) => {
            Color.saveRGBtoSettings(settings, 'text-color', check.get_rgba());
        });

        let text_coloration_use_when_maximized = builder.get_object('text_coloration_use_when_maximized');
        text_coloration_use_when_maximized.set_sensitive(text_coloration_enable_check.get_active());
        let text_coloration_use_when_maximized_check = builder.get_object('text_coloration_use_when_maximized_check');
        text_coloration_use_when_maximized_check.set_active(settings.get_boolean('enable-maximized-text-color'));
        text_coloration_use_when_maximized_check.connect('state-set', (check) => {
            settings.set_value('enable-maximized-text-color', new GLib.Variant('b', check.get_active()));
        });

        let text_coloration_use_when_visible = builder.get_object('text_coloration_use_when_visible');
        text_coloration_use_when_visible.set_sensitive(text_coloration_enable_check.get_active());
        let text_coloration_use_when_visible_check = builder.get_object('text_coloration_use_when_visible_check');
        text_coloration_use_when_visible_check.set_active(settings.get_boolean('enable-overview-text-color'));
        text_coloration_use_when_visible_check.connect('state-set', (check) => {
            settings.set_value('enable-overview-text-color', new GLib.Variant('b', check.get_active()));
        });

        let text_shadowing_enable_check = builder.get_object('text_shadowing_enable_check');
        text_shadowing_enable_check.set_active(settings.get_boolean('text-shadow'));
        text_shadowing_enable_check.connect('state-set', (check) => {
            settings.set_value('text-shadow', new GLib.Variant('b', check.get_active()));
        });


        let [text_x, text_y, text_shadow] = Position.getFromSettings(settings, 'text-shadow-position');

        let text_shadow_x_offset = builder.get_object('text_shadow_x_offset');
        text_shadow_x_offset.set_sensitive(text_shadowing_enable_check.get_active());
        let text_shadow_x_offset_spin = builder.get_object('text_shadow_x_offset_spin');
        text_shadow_x_offset_spin.set_value(text_x);
        text_shadow_x_offset_spin.connect('value-changed', (scale) => {
            const id = (this.text_shadow_x_offset_timeout_id = setTimeout(() => {
                if (this.text_shadow_x_offset_timeout_id !== id) {
                    return;
                }
                Position.saveToSettings(settings, 'text-shadow-position', [scale.get_value(), text_y, text_shadow]);
                return;
            }, 500));
        });

        let text_shadow_y_offset = builder.get_object('text_shadow_y_offset');
        text_shadow_y_offset.set_sensitive(text_shadowing_enable_check.get_active());
        let text_shadow_y_offset_spin = builder.get_object('text_shadow_y_offset_spin');
        text_shadow_y_offset_spin.set_value(text_y);
        text_shadow_y_offset_spin.connect('value-changed', (scale) => {
            const id = (this.text_shadow_y_offset_timeout_id = setTimeout(() => {
                if (this.text_shadow_y_offset_timeout_id !== id) {
                    return;
                }
                Position.saveToSettings(settings, 'text-shadow-position', [text_x, scale.get_value(), text_shadow]);
                return;
            }, 500));
        });

        let text_shadow_radius = builder.get_object('text_shadow_radius');
        text_shadow_radius.set_sensitive(text_shadowing_enable_check.get_active());
        let text_shadow_radius_spin = builder.get_object('text_shadow_radius_spin');
        text_shadow_radius_spin.set_value(text_shadow);
        text_shadow_radius_spin.connect('value-changed', (scale) => {
            const id = (this.text_shadow_radius_timeout_id = setTimeout(() => {
                if (this.text_shadow_radius_timeout_id !== id) {
                    return;
                }
                Position.saveToSettings(settings, 'text-shadow-position', [text_x, text_y, scale.get_value()]);
                return;
            }, 500));
        });

        let text_shadow_color_row = builder.get_object('text_shadow_color');
        text_shadow_color_row.set_sensitive(text_shadowing_enable_check.get_active());
        let text_shadow_color_picker = builder.get_object('text_shadow_color_picker');
        let text_shadow_color = Color.getRGBAFromSettings(settings, 'text-shadow-color');
        text_shadow_color_picker.set_rgba(text_shadow_color);
        text_shadow_color_picker.connect('notify::rgba', (check) => {
            Color.saveRGBAtoSettings(settings, 'text-shadow-color', check.get_rgba(), '(iiid)');
        });

        let icon_shadowing_enable_check = builder.get_object('icon_shadowing_enable_check');
        icon_shadowing_enable_check.set_active(settings.get_boolean('icon-shadow'));
        icon_shadowing_enable_check.connect('state-set', (check) => {
            settings.set_value('icon-shadow', new GLib.Variant('b', check.get_active()));
        });

        let [icon_x, icon_y, icon_radius] = Position.getFromSettings(settings, 'icon-shadow-position');

        let icon_shadow_x_offset = builder.get_object('icon_shadow_x_offset');
        icon_shadow_x_offset.set_sensitive(icon_shadowing_enable_check.get_active());
        let icon_shadow_x_offset_spin = builder.get_object('icon_shadow_x_offset_spin');
        icon_shadow_x_offset_spin.set_value(icon_x);
        icon_shadow_x_offset_spin.connect('value-changed', (scale) => {
            const id = (this.icon_shadow_x_offset_timeout_id = setTimeout(() => {
                if (this.icon_shadow_x_offset_timeout_id !== id) {
                    return;
                }
                Position.saveToSettings(settings, 'icon-shadow-position', [scale.get_value(), icon_y, icon_radius]);
                return;
            }, 500));
        });

        let icon_shadow_y_offset = builder.get_object('icon_shadow_y_offset');
        icon_shadow_y_offset.set_sensitive(icon_shadowing_enable_check.get_active());
        let icon_shadow_y_offset_spin = builder.get_object('icon_shadow_y_offset_spin');
        icon_shadow_y_offset_spin.set_value(icon_y);
        icon_shadow_y_offset_spin.connect('value-changed', (scale) => {
            const id = (this.icon_shadow_y_offset_timeout_id = setTimeout(() => {
                if (this.icon_shadow_y_offset_timeout_id !== id) {
                    return;
                }
                Position.saveToSettings(settings, 'icon-shadow-position', [icon_x, scale.get_value(), icon_radius]);
                return;
            }, 500));
        });

        let icon_shadow_radius = builder.get_object('icon_shadow_radius');
        icon_shadow_radius.set_sensitive(icon_shadowing_enable_check.get_active());
        let icon_shadow_radius_spin = builder.get_object('icon_shadow_radius_spin');
        icon_shadow_radius_spin.set_value(icon_radius);
        icon_shadow_radius_spin.connect('value-changed', (scale) => {
            const id = (this.icon_shadow_radius_timeout_id = setTimeout(() => {
                if (this.icon_shadow_radius_timeout_id !== id) {
                    return;
                }
                Position.saveToSettings(settings, 'icon-shadow-position', [icon_x, icon_y, scale.get_value()]);
                return;
            }, 500));
        });

        let icon_shadow_color_row = builder.get_object('icon_shadow_color');
        icon_shadow_color_row.set_sensitive(icon_shadowing_enable_check.get_active());
        let icon_shadow_color_picker = builder.get_object('icon_shadow_color_picker');
        let icon_shadow_color = Color.getRGBAFromSettings(settings, 'icon-shadow-color');
        icon_shadow_color_picker.set_rgba(icon_shadow_color);
        icon_shadow_color_picker.connect('notify::rgba', (check) => {
            Color.saveRGBAtoSettings(settings, 'icon-shadow-color', check.get_rgba(), '(iiid)');
        });

        /* Third tab: Background */
        let page3 = builder.get_object('background');

        let opacity_enable_check = builder.get_object('opacity_enable_check');
        opacity_enable_check.set_active(settings.get_boolean('enable-opacity'));
        opacity_enable_check.connect('state-set', (check) => {
            settings.set_value('enable-opacity', new GLib.Variant('b', check.get_active()));
        });

        let opacity_window_maximized = builder.get_object('opacity_window_maximized');
        opacity_window_maximized.set_sensitive(opacity_enable_check.get_active());
        let opacity_window_maximized_scale = builder.get_object('opacity_window_maximized_scale');
        opacity_window_maximized_scale.set_value(settings.get_int('maximized-opacity'));
        opacity_window_maximized_scale.connect('value-changed', (scale) => {
            const id = (this.opacity_window_maximized_timeout_id = setTimeout(() => {
                if (this.opacity_window_maximized_timeout_id !== id) {
                    return;
                }
                settings.set_value('maximized-opacity', new GLib.Variant('i', scale.get_value()));
                return;
            }, 500));
        });

        let opacity_no_window_maximized = builder.get_object('opacity_no_window_maximized');
        opacity_no_window_maximized.set_sensitive(opacity_enable_check.get_active());
        let opacity_no_window_maximized_scale = builder.get_object('opacity_no_window_maximized_scale');
        opacity_no_window_maximized_scale.set_value(settings.get_int('unmaximized-opacity'));
        opacity_no_window_maximized_scale.connect('value-changed', (scale) => {
            const id = (this.opacity_no_window_maximized_timeout_id = setTimeout(() => {
                if (this.opacity_no_window_maximized_timeout_id !== id) {
                    return;
                }
                settings.set_value('unmaximized-opacity', new GLib.Variant('i', scale.get_value()));
                return;
            }, 500));
        });

        let panel_background_color_enable_check = builder.get_object('panel_background_color_enable_check');
        panel_background_color_enable_check.set_active(settings.get_boolean('enable-background-color'));
        panel_background_color_enable_check.connect('state-set', (check) => {
            settings.set_value('enable-background-color', new GLib.Variant('b', check.get_active()));
        });

        let panel_background_color_row = builder.get_object('panel_background_color_row');
        panel_background_color_row.set_sensitive(panel_background_color_enable_check.get_active());
        let panel_background_color_picker = builder.get_object('panel_background_color_picker');
        let panel_background_color = Color.getRGBAFromSettings(settings, 'panel-color');
        panel_background_color_picker.set_rgba(panel_background_color);
        panel_background_color_picker.connect('notify::rgba', (check) => {
            Color.saveRGBAtoSettings(settings, 'panel-color', check.get_rgba(), 'ai');
        });

        /*let compatibility_remove_excess_panel_styling_check = builder.get_object('compatibility_remove_excess_panel_styling_check');
        compatibility_remove_excess_panel_styling_check.set_active(settings.get_boolean('remove-panel-styling'));
        compatibility_remove_excess_panel_styling_check.connect('state-set', (check) => {
            settings.set_value('remove-panel-styling', new GLib.Variant('b', check.get_active()));
        });*/

        window.add(page);
        window.add(page2);
        window.add(page3);

        let about_button = builder.get_object('about_button');
        about_button.connect('clicked', () => {
            let aboutWindow = new Adw.AboutWindow({
                application_name: "Dynamic Panel Transparency",
                application_icon: "computer",
                version: "45",
                developer_name: "Evan Welsh (ewlsh)",
                license_type: Gtk.License.GPL_2_0,
                website: "https://github.com/ewlsh/dynamic-panel-transparency",
                issue_url: "https://github.com/ewlsh/dynamic-panel-transparency/issues",
                developers: ["Evan Welsh (ewlsh)", "Francwa"],
                translator_credits: "Alexey Varfolomeev (varlesh)\nJonatan Hatakeyama Zeidler (jonnius)\nFábio Nogueira (frnogueira)\nMosaab Alzoubi (moceap)\nAlonso Lara (AlonsoLP)\nDingzhong Chen (wsxy162)\nnarzb",
                comments: "Classy transparency for your panel."
            });
            aboutWindow.show();
        });
    }
}
