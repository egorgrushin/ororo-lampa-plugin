import { PLUGIN_NAME } from '../../constants';
import styles from './styles.scss';

const template = `
    <div class="${styles.root} selector">
        <div class="${styles.img}"><img alt=""></div>
        <div class="${styles.body}">
            <div class="${styles.head}">
                <div class="${styles.title}">{name}</div>
            </div>
    
            <div class="${styles.timeline}"></div>
    
            <div class="${styles.footer}">
                <div class="${styles.info}">{releaseDate}</div>
            </div>
        </div>
    </div>
`;


export const EPISODE_TEMPLATE = {
    name: `${PLUGIN_NAME}-episode`,
    template,
    classNames: styles
};
