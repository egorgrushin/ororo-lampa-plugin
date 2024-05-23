import { PLUGIN_NAME } from '../../constants';
import styles from './styles.scss';

const template = `
    <div class="${styles.root} selector">
        <div class="${styles.image}">
            <img alt="" class="${styles.image__background}"
                src="{previewImageUrl}">
            <span class="${styles.image__number}">{episodeNumberFormatted}</span>
        </div>
        <div class="${styles.body}">
            <div class="${styles.head}">
                <div class="${styles.title}">{name}</div>
                <div class="${styles.duration}">{duration}</div>
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
    classNames: styles,
};
