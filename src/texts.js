import { PLUGIN_NAME } from './constants';

export const TEXTS = {
    Title: `${PLUGIN_NAME}-title`,
    EmptyFilter: `${PLUGIN_NAME}-empty-filter`,
    SeasonTitle: `${PLUGIN_NAME}-season-title`,
    NoOroroShow: `${PLUGIN_NAME}-no-ororo-show`,
    Oops: `${PLUGIN_NAME}-oops`,
};

export const registerTexts = () => {
    Lampa.Lang.add({
        [TEXTS.Title]: { ru: 'Ororo', en: 'Ororo' },
        [TEXTS.EmptyFilter]: { ru: 'Empty', en: 'Empty' },
        [TEXTS.SeasonTitle]: { ru: 'Сезон', en: 'Season' },
        [TEXTS.NoOroroShow]: { ru: 'Этого сериала нет на ororo.tv', en: 'This show is not listed in ororo.tv' },
        [TEXTS.Oops]: { ru: 'Упс', en: 'Oops' },
    });
};
