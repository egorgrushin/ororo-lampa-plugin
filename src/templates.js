import { PLUGIN_NAME } from './constants';

export const TEMPLATE_NAMES = {
    ContentLoading: `${PLUGIN_NAME}-content-loading`,
};

const CONTENT_LOADING_TEMPLATE = `
    <div class="online-empty">
        <div class="broadcast__scan"><div></div></div>
        <div class="online-empty__templates">
            <div class="online-empty-template selector">
                <div class="online-empty-template__ico"></div>
                <div class="online-empty-template__body"></div>
            </div>
            <div class="online-empty-template">
                <div class="online-empty-template__ico"></div>
                <div class="online-empty-template__body"></div>
            </div>
            <div class="online-empty-template">
                <div class="online-empty-template__ico"></div>
                <div class="online-empty-template__body"></div>
            </div>
        </div>
    </div>
`;

export const resetTemplates = () => {
    Lampa.Template.add(TEMPLATE_NAMES.ContentLoading, CONTENT_LOADING_TEMPLATE);
};

export const getTemplate = (name) => Lampa.Template.get(name);
