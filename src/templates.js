import { CONTENT_LOADING_TEMPLATE, EPISODE_TEMPLATE } from './components';

const ALL_TEMPLATES = [
    CONTENT_LOADING_TEMPLATE,
    EPISODE_TEMPLATE,
];


export const registerTemplates = () => {
    ALL_TEMPLATES.forEach(({ name, template }) => {
        Lampa.Template.add(name, template);
    });
};

export const getTemplate = (template, data) => Lampa.Template.get(template.name, data);
