import { PLUGIN_NAME } from '../../constants';
import styles from './styles.scss';

const template = `<div class="empty">
    <div class="empty__img selector"></div>
    <div class="empty__title">{title}</div>
    <div class="empty__descr">{description}</div>
</div>`;

export const EMPTY_TEMPLATE = {
    name: `${PLUGIN_NAME}-empty`,
    template,
    classNames: styles,
};
