import { OroroComponent } from './component';
import { COMPONENT_NAME, OPEN_BUTTON_ID, PLUGIN_NAME } from './constants';
import { translate } from './utils';
import { resetTemplates } from './templates';
import { registerTexts, TEXTS } from './texts';

const open = (cardData) => {
    resetTemplates();
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

const initPlugin = () => {
    registerTexts();
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
    window.is_ororo_plugin_ready = true;
};

if (!window.is_ororo_plugin_ready) {
    initPlugin();
}
