import { getCurrentActivity, getCurrentLanguage, pad, translate } from './utils';
import { getTemplate } from './templates';
import { CONTENT_CONTROLLER_NAME, FILTER_KEY } from './constants';
import { TEXTS } from './texts';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilKeyChanged, filter, switchMap, tap } from 'rxjs/operators';
import { createAffectLoadingState } from './affectLoadingState';
import { CONTENT_LOADING_TEMPLATE, EPISODE_TEMPLATE } from './components';

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

    fetchEpisodes$(selectedFilterItem) {
        const season = selectedFilterItem.number;
        const tmdbUrl = `tv/${this.movie.id}/season/${season}?api_key=${Lampa.TMDB.key()}&language=${getCurrentLanguage()}`;
        const url = Lampa.TMDB.api(tmdbUrl);
        return this.request$(url);
    }

    setSelectedFilterText(text) {
        this.filter.chosen(FILTER_KEY, [text ?? translate(TEXTS.EmptyFilter)]);
    }

    applySelectedFilterItem$(selectedFilterItem) {
        return this.fetchEpisodes$(selectedFilterItem).pipe(tap((episodes) => this.setEpisodes(episodes)));
    }

    setEpisodes(episodes) {
        const episodesHtml = episodes.map((episode) => {
            const timeline_hash = Lampa.Utils.hash(`${this.movie.original_title}:${episode.season}:${episode.number}`);
            const enrichedEpisode = {
                ...episode,
                number: pad(episode.episode_number, 2),
                duration: Lampa.Utils.secondsToTime(episode.runtime * 60, true),
                releaseDate: Lampa.Utils.parseTime(episode.air_date).full,
                previewImageUrl: Lampa.TMDB.image(`t/p/w300${episode.still_path}`),
            };
            const episodeHtml = getTemplate(EPISODE_TEMPLATE, enrichedEpisode);
            episodeHtml
                .find(`.${EPISODE_TEMPLATE.classNames.timeline}`)
                .append(Lampa.Timeline.render(Lampa.Timeline.view(timeline_hash)));

            const imgRef = episodeHtml.find(`.${EPISODE_TEMPLATE.classNames.image__background}`)[0];
            imgRef.onerror = () => imgRef.remove();
            imgRef.onload = () => imgRef.addClass(EPISODE_TEMPLATE.classNames.loaded);

            return episodeHtml;
        });

        this.scroll.clear();
        this.scroll.body().append(...episodesHtml);
        Lampa.Controller.enable(CONTENT_CONTROLLER_NAME);
    }

    initFlow() {
        const affectLoadingState = createAffectLoadingState(({ isLoading }) => this.setIsLoading(isLoading));
        this.flowSubscription = this.filterSubject
            .pipe(
                tap((selectedFilterItem) => this.setSelectedFilterText(selectedFilterItem?.title)),
                distinctUntilKeyChanged('id'),
                filter((selectedFilterItem) => !!selectedFilterItem),
                switchMap((selectedFilterItem) =>
                    affectLoadingState(this.applySelectedFilterItem$(selectedFilterItem)),
                ),
            )
            .subscribe();
    }

    initFilter() {
        const validSeasons = this.movie.seasons.filter(({ season_number }) => season_number > 0);
        const selectedSeasonId = validSeasons[0].id;
        const filterItems = validSeasons.map((season) => ({
            id: season.id,
            title: season.name,
            number: season.season_number,
            isSelected: season.id === selectedSeasonId,
        }));
        const selectedFilterItem = filterItems.find(({ isSelected }) => isSelected);
        this.filter.set(FILTER_KEY, filterItems);
        // hide filter search button
        this.filter.render().find('.filter--search').addClass('hide');
        this.filterSubject = new BehaviorSubject(selectedFilterItem);
        this.initFlow();
        this.filter.onSelect = (type, selectedFilterItem) => {
            Lampa.Select.close();
            this.filterSubject.next(selectedFilterItem);
        };
    }

    initBody() {
        // add scroll smoothness
        this.scroll.body().addClass('torrent-list');
        this.explorer.appendFiles(this.scroll.render());
        this.explorer.appendHead(this.filter.render());
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
        if (isLoading) {
            this.scroll.clear();
            this.scroll.reset();
            this.scroll.body().append(getTemplate(CONTENT_LOADING_TEMPLATE));
        } else {
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
        Lampa.Controller.enable(CONTENT_CONTROLLER_NAME);
    }

    back() {
        Lampa.Activity.backward();
    }

    pause() {}

    stop() {}

    destroy() {
        this.flowSubscription.unsubscribe();
        // this.network.clear();
        this.filter.destroy();
        this.explorer.destroy();
        this.scroll.destroy();
    }

    request$(url) {
        return new Observable((subscriber) => {
            this.request.timeout(1000 * 10);
            this.request.native(
                url,
                (data) => {
                    subscriber.next(data.episodes);
                    subscriber.complete();
                },
                (err) => {
                    subscriber.error(err);
                },
            );
        });
    }
}
