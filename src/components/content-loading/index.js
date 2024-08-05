import { PLUGIN_NAME } from '../../constants';
import styles from './styles.scss';

const template = `
    <div class="${styles.root}">
        <div class="broadcast__scan"><div></div></div>
        <div class="${styles.templates}">
            <div class="${styles.template} selector">
                <div class="${styles.template__ico}"></div>
                <div class="${styles.template__body}"></div>
            </div>
            <div class="${styles.template}">
                <div class="${styles.template__ico}"></div>
                <div class="${styles.template__body}"></div>
            </div>
            <div class="${styles.template}">
                <div class="${styles.template__ico}"></div>
                <div class="${styles.template__body}"></div>
            </div>
        </div>
    </div>
`;

export const CONTENT_LOADING_TEMPLATE = {
    name: `${PLUGIN_NAME}-content-loading`,
    template,
};
