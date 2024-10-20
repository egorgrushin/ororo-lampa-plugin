import { OroroComponent } from './component';
import {
    COMPONENT_NAME,
    IS_PLUGIN_READY,
    IS_PLUGIN_SETTINGS_READY,
    LOGIN_SETTING_PARAM,
    OPEN_BUTTON_ID,
    PASSWORD_SETTING_PARAM,
    PLUGIN_NAME,
    SETTINGS_COMPONENT_NAME,
} from './constants';
import { translate } from './utils';
import { registerTemplates } from './templates';
import { registerTexts, TEXTS } from './texts';

const open = (cardData) => {
    Lampa.Activity.push({
        url: '',
        title: translate(TEXTS.Title),
        component: COMPONENT_NAME,
        movie: cardData.movie,
        page: 1,
    });
};

const addOpenButtonToCard = (manifest, whereToRender, cardData) => {
    if (whereToRender.find(`#${OPEN_BUTTON_ID}`).length) return;
    const button = $('<div></div>');
    button.attr('id', OPEN_BUTTON_ID);
    // required classes for correct button rendering
    button.addClass('full-start__button selector');
    button.attr('data-subtitle', `${manifest.name} v${manifest.version}`);
    button.text(translate(TEXTS.Title));
    button.on('hover:enter', () => open(cardData));
    whereToRender.before(button);
};

const addSettings = () => {
    if (window[IS_PLUGIN_SETTINGS_READY]) return;
    window[IS_PLUGIN_SETTINGS_READY] = true;
    Lampa.SettingsApi.addComponent({
        component: SETTINGS_COMPONENT_NAME,
        name: translate(TEXTS.Title),
    });
    Lampa.SettingsApi.addParam({
        component: SETTINGS_COMPONENT_NAME,
        param: {
            name: LOGIN_SETTING_PARAM,
            type: 'input',
            default: '',
        },
        field: {
            name: translate(TEXTS.LoginSettingsParam),
        },
    });
    Lampa.SettingsApi.addParam({
        component: SETTINGS_COMPONENT_NAME,
        param: {
            name: PASSWORD_SETTING_PARAM,
            type: 'input',
            default: '',
        },
        field: {
            name: translate(TEXTS.PasswordSettingsParam),
        },
    });
};

const initPlugin = () => {
    registerTexts();
    registerTemplates();
    const manifest = {
        type: 'video',
        version: '0.0.2',
        name: PLUGIN_NAME,
        description: 'Плагин для просмотра сериалов и фильмов на сервисе ororo.tv',
        component: COMPONENT_NAME,
    };
    Lampa.Component.add(COMPONENT_NAME, OroroComponent);
    Lampa.Manifest.plugins = manifest;
    Lampa.Listener.follow('full', (e) => {
        if (e.type !== 'complite') return;
        const whereToRender = e.object.activity.render().find('.button--play');
        addOpenButtonToCard(manifest, whereToRender, e.data);
    });
    Lampa.Listener.follow('app', (e) => {
        if (e.type !== 'ready') return;
        addSettings();
    });

    window[IS_PLUGIN_READY] = true;
};
if (!window[IS_PLUGIN_READY]) {
    initPlugin();
}
