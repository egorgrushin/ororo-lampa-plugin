import { COMPONENT_NAME } from './constants';

export const TEXTS = {
    Title: `${COMPONENT_NAME}-title`,
    EmptyFilter: `${COMPONENT_NAME}-empty-filter`,
};

export const registerTexts = () => {
    Lampa.Lang.add({
        [TEXTS.Title]: { en: 'Ororo.tv' },
        [TEXTS.EmptyFilter]: { en: 'Empty' },
    });
};
