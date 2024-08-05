export const getCurrentActivity = () => Lampa.Activity.active().activity;
export const translate = (key) => Lampa.Lang.translate(key);

export const getCurrentLanguage = () => Lampa.Storage.get('language', 'ru');

export const pad = (value, leadingCharLength, leadingChar = '0') => `${leadingChar}${value}`.slice(-leadingCharLength);
