import { getCurrentActivity, translate } from './utils';
import { getTemplate, TEMPLATE_NAMES } from './templates';
import { CONTENT_CONTROLLER_NAME, FILTER_KEY } from './constants';
import { TEXTS } from './texts';
import { Subject } from 'rxjs';
import { delay, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs/internal/observable/of';
import { createAffectLoadingState } from './affectLoadingState';

export class OroroComponent {
    constructor(input) {
        this.movie = input.movie;
        this.request = new Lampa.Reguest();
        this.scroll = new Lampa.Scroll({ mask: true, over: true });
        this.explorer = new Lampa.Explorer(input);
        this.filter = new Lampa.Filter(input);
        this.isInit = false;
        this.last = undefined;
        this.activity = undefined;
    }

    start() {
        if (getCurrentActivity() !== this.activity) return;
        if (!this.isInit) {
            this.init();
            this.isInit = true;
        }
        Lampa.Background.immediately(Lampa.Utils.cardImgBackgroundBlur(this.movie));
        this.initController();
    }

    initFlow() {
        const affectLoadingState = createAffectLoadingState(({ isLoading }) => this.setIsLoading(isLoading));
        const fetchEpisodes$ = (selectedFilterItem) => of([1, 2, 3]).pipe(delay(3000));

        this.flowSubscription = this.filterSubject.pipe(
            tap((selectedFilterItem) => {
                this.filter.chosen(FILTER_KEY, [selectedFilterItem.title ?? translate(TEXTS.EmptyFilter)]);
                Lampa.Select.close();
            }),
            switchMap((selectedFilterItem) => affectLoadingState(
                fetchEpisodes$(selectedFilterItem),
            )),
        ).subscribe();
    }

    initFilter() {
        const selectedSeasonId = 215686;
        const filterItems = this.movie.seasons.map((season) => ({
            id: season.id,
            title: season.name,
            isSelected: season.id === selectedSeasonId,
        }));
        const selectedFilterItem = filterItems.find(({ isSelected }) => isSelected);
        this.filter.set(FILTER_KEY, filterItems);
        // hide filter search button
        this.filter.render().find('.filter--search').addClass('hide');
        this.filterSubject = new Subject(selectedFilterItem);
        this.initFlow();
        this.filter.onSelect = (type, selectedFilterItem) => this.filterSubject.next(selectedFilterItem);
    }

    initBody() {
        // add scroll smoothness
        this.scroll.body().addClass('torrent-list');
        this.explorer.appendFiles(this.scroll.render());
        this.explorer.appendHead(this.filter.render());
        // Lampa.Controller.enable(CONTENT_CONTROLLER_NAME);
        this.scroll.minus(this.render().find('.explorer__files-head'));
        this.scroll.body().append(getTemplate(TEMPLATE_NAMES.ContentLoading));
    }

    init() {
        this.initFilter();
        this.initBody();
    }

    create() {
        return this.render();
    }

    render() {
        return this.explorer.render();
    }

    play() {
        // var item = {
        //     title: Lampa.Utils.shortText('test play 679', 50),
        //     id: '679',
        //     youtube: false,
        //     url: 'https://static-ru.ororo-mirror.tv/uploads/video/file/679/friends.s06e10.720p.bluray.x264-psychd_1482412373_720p.mp4?attachment=true&wmsAuthSign=aWQ9MjE4Njc2NCsxNjQzMzQyNzY1MmJmMWRlNTk5NGZiMzJiOWQ0ZmM2Yit2aWRlbys2Nzkmc2VydmVyX3RpbWU9Ny8yNy8yMDI0IDEwOjAwOjExIFBNJmhhc2hfdmFsdWU9aDB2c1Vad3pZeFBHTDBOVjFwWU81UT09JnZhbGlkbWludXRlcz0xOTIwJnN0cm1fbGVuPTgx',
        //     icon: '<img class="size-youtube" src="https://img.youtube.com/vi/' + '679' + '/default.jpg" />',
        //     template: 'selectbox_icon',
        // };
        // Lampa.Player.play(item);
        // Lampa.Player.playlist([item]);
    }

    setIsLoading(isLoading) {
        this.activity.loader(isLoading);
        if (!isLoading) {
            this.activity.toggle();
        }
    }

    initController() {
        Lampa.Controller.add(CONTENT_CONTROLLER_NAME, {
            toggle: () => {
                Lampa.Controller.collectionSet(this.scroll.render(), this.render());
                Lampa.Controller.collectionFocus(this.last ?? false, this.scroll.render());
            },
            up: () => {
                if (Navigator.canmove('up')) return Navigator.move('up');
                Lampa.Controller.toggle('head');
            },
            down: () => {
                Navigator.move('down');
            },
            right: () => {
                if (Navigator.canmove('right')) return Navigator.move('right');
                this.filter.show(translate('title_filter'), FILTER_KEY);
            },
            left: () => {
                if (Navigator.canmove('left')) return Navigator.move('left');
                Lampa.Controller.toggle('menu');
            },
            back: () => {
                Lampa.Activity.backward();
            },
        });
        Lampa.Controller.toggle(CONTENT_CONTROLLER_NAME);
    }

    back() {
        Lampa.Activity.backward();
    };
    pause() {};
    stop() {};

    destroy() {
        this.flowSubscription.unsubscribe();
        // this.network.clear();
        this.filter.destroy();
        this.explorer.destroy();
        this.scroll.destroy();
    }
}
