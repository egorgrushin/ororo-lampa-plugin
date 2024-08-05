export const getCurrentActivity = () => Lampa.Activity.active().activity;
export const translate = (key) => Lampa.Lang.translate(key);

export const getCurrentLanguage = () => Storage.get('language', 'ru');
