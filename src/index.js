import { OroroComponent } from './component';
import {
    COMPONENT_NAME,
    IS_PLUGIN_READY,
    IS_PLUGIN_SETTINGS_READY,
    LOGIN_SETTING_PARAM,
    OPEN_BUTTON_ID,
    ORORO_API_KEY,
    PASSWORD_SETTING_PARAM,
    PLUGIN_NAME,
    SETTINGS_COMPONENT_NAME,
} from './constants';
import { translate } from './utils';
import { registerTemplates } from './templates';
import { registerTexts, TEXTS } from './texts';
import { createOroroApi } from './ororo';

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
        icon: `<svg width="28" height="29" viewBox="0 0 28 29" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.35883 18.1883L1.63573 17.4976L2.35883 18.1883L3.00241 17.5146C3.8439 16.6337 4.15314 15.4711 4.15314 14.4013C4.15314 13.3314 3.8439 12.1688 3.00241 11.2879L2.27931 11.9786L3.00241 11.2879L2.35885 10.6142C1.74912 9.9759 1.62995 9.01336 2.0656 8.24564L2.66116 7.19613C3.10765 6.40931 4.02672 6.02019 4.90245 6.24719L5.69281 6.45206C6.87839 6.75939 8.05557 6.45293 8.98901 5.90194C9.8943 5.36758 10.7201 4.51559 11.04 3.36732L11.2919 2.46324C11.5328 1.59833 12.3206 1 13.2185 1H14.3282C15.225 1 16.0121 1.59689 16.2541 2.46037L16.5077 3.36561C16.8298 4.51517 17.6582 5.36897 18.5629 5.90557C19.498 6.4602 20.6725 6.75924 21.8534 6.45313L22.6478 6.2472C23.5236 6.02019 24.4426 6.40932 24.8891 7.19615L25.4834 8.24336C25.9194 9.0118 25.7996 9.97532 25.1885 10.6135L24.5426 11.2882C23.7 12.1684 23.39 13.3312 23.39 14.4013C23.39 15.4711 23.6992 16.6337 24.5407 17.5146L25.1842 18.1883C25.794 18.8266 25.9131 19.7891 25.4775 20.5569L24.8819 21.6064C24.4355 22.3932 23.5164 22.7823 22.6406 22.5553L21.8503 22.3505C20.6647 22.0431 19.4876 22.3496 18.5541 22.9006C17.6488 23.4349 16.8231 24.2869 16.5031 25.4352L16.2513 26.3393C16.0103 27.2042 15.2225 27.8025 14.3246 27.8025H13.2184C12.3206 27.8025 11.5328 27.2042 11.2918 26.3393L11.0413 25.4402C10.7206 24.2889 9.89187 23.4336 8.98627 22.8963C8.05183 22.342 6.87822 22.0432 5.69813 22.3491L4.90241 22.5553C4.02667 22.7823 3.10759 22.3932 2.66111 21.6064L2.06558 20.5569C1.62993 19.7892 1.74911 18.8266 2.35883 18.1883Z" stroke="currentColor" stroke-width="2.4"></path>
                    <circle cx="13.7751" cy="14.4013" r="4.1675" stroke="currentColor" stroke-width="2.4"></circle>
                </svg>`,
    });
    Lampa.SettingsApi.addParam({
        component: SETTINGS_COMPONENT_NAME,
        param: {
            name: LOGIN_SETTING_PARAM,
            type: 'input',
            default: '',
            values: '',
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
            values: '',
        },
        field: {
            name: translate(TEXTS.PasswordSettingsParam),
        },
    });
};

const initOroroApi = () => {
    window[ORORO_API_KEY] = createOroroApi();
};

const initPlugin = () => {
    registerTexts();
    registerTemplates();
    initOroroApi();
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
        initOroroApi();
    });

    window[IS_PLUGIN_READY] = true;
};
if (!window[IS_PLUGIN_READY]) {
    initPlugin();
}
