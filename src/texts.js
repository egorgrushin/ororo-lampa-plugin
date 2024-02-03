import { PLUGIN_NAME } from './constants';

export const TEXTS = {
    Title: `${PLUGIN_NAME}-title`,
    EmptyFilter: `${PLUGIN_NAME}-empty-filter`,
};

export const registerTexts = () => {
    Lampa.Lang.add({
        [TEXTS.Title]: { ru: 'Ororo.tv', en: 'Ororo.tv' },
        [TEXTS.EmptyFilter]: { ru: 'Empty', en: 'Empty' },
    });
};
