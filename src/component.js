import { getCurrentActivity, getCurrentLanguage, pad, translate } from './utils';
import { getTemplate } from './templates';
import { CONTENT_CONTROLLER_NAME, FILTER_KEY } from './constants';
import { TEXTS } from './texts';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { catchError, distinctUntilKeyChanged, filter, map, switchMap, tap } from 'rxjs/operators';
import { CONTENT_LOADING_TEMPLATE, EMPTY_TEMPLATE, EPISODE_TEMPLATE } from './components';
import { createOroroApi } from './ororo';
import { throwError } from 'rxjs/internal/observable/throwError';
import { EMPTY } from 'rxjs/internal/observable/empty';
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
        this.ororoApi = createOroroApi();
    }

    start() {
        if (getCurrentActivity() !== this.activity) return;
        if (!this.isInit) {
            this.init();
            this.isInit = true;
        }
        Lampa.Background.immediately(Lampa.Utils.cardImgBackgroundBlur(this.movie));
    }

    fetchTmdbEpisodes$(seasonNumber) {
        const tmdbUrl = `tv/${this.movie.id}/season/${seasonNumber}?api_key=${Lampa.TMDB.key()}&language=${getCurrentLanguage()}`;
        const url = Lampa.TMDB.api(tmdbUrl);
        return this.request$(url);
    }

    setSelectedFilterText(text) {
        this.filter.chosen(FILTER_KEY, [text ?? translate(TEXTS.EmptyFilter)]);
    }

    setEpisodes(ororoShow, seasonNumber, tmdbEpisodes) {
        const ororoEpisodes = ororoShow.episodesBySeasons[seasonNumber];
        const tmdbEpisodesMap = tmdbEpisodes.reduce((memo, tmdbEpisode) => {
            memo[tmdbEpisode.episodeNumber] = tmdbEpisode;
            return memo;
        }, {});

        const episodesHtml = ororoEpisodes.map((episode) => {
            const episodeNumber = episode.episodeNumber;
            const tmdbEpisode = tmdbEpisodesMap[episodeNumber];
            const timeline_hash = Lampa.Utils.hash(
                `${this.movie.original_title}:${episode.seasonNumber}:${episodeNumber}`,
            );
            const duration = tmdbEpisode ? Lampa.Utils.secondsToTime(tmdbEpisode.runtime * 60, true) : undefined;
            const airDate = tmdbEpisode?.airDate ?? episode.airDate;
            const enrichedEpisode = {
                ...episode,
                episodeNumberFormatted: pad(episodeNumber, 2),
                duration,
                releaseDate: Lampa.Utils.parseTime(airDate).full,
                previewImageUrl: tmdbEpisode?.previewImageUrl,
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

    initFlow(movie) {
        const affectActivityLoadingState = createAffectLoadingState(({ isLoading }) =>
            this.setActivityIsLoading(isLoading),
        );
        const affectBodyLoadingState = createAffectLoadingState(({ isLoading }) => this.setBodyIsLoading(isLoading));
        this.flowSubscription = affectActivityLoadingState(
            from(this.ororoApi.getShowsFragments()).pipe(
                map((ororoShowsFragments) =>
                    ororoShowsFragments.find(({ tmdb_id }) => tmdb_id === movie.id.toString()),
                ),
                switchMap((ororoShowFragment) => {
                    if (!ororoShowFragment) return throwError(() => new Error(translate(TEXTS.NoOroroShow)));
                    return from(this.ororoApi.getShow(ororoShowFragment.id));
                }),
                map((ororoShow) => this.formatOroroShow(ororoShow)),
                switchMap((ororoShow) => this.getFilter$(ororoShow).pipe(map((filter) => [ororoShow, filter]))),
                switchMap(([ororoShow, { seasonNumber }]) =>
                    affectBodyLoadingState(
                        this.fetchTmdbEpisodes$(seasonNumber).pipe(
                            map((tmdbEpisodes) => this.formatTmdbEpisodes(tmdbEpisodes)),
                            map((tmdbEpisodes) => [ororoShow, seasonNumber, tmdbEpisodes]),
                        ),
                    ),
                ),
                catchError((error) => {
                    this.renderError(error);
                    return EMPTY;
                }),
            ),
        ).subscribe(([ororoShow, seasonNumber, tmdbEpisodes]) =>
            this.setEpisodes(ororoShow, seasonNumber, tmdbEpisodes),
        );
    }

    formatTmdbEpisodes(tmdbEpisodes) {
        return tmdbEpisodes.map((tmdbEpisode) => ({
            ...tmdbEpisode,
            airDate: tmdbEpisode.air_date,
            episodeNumber: tmdbEpisode.episode_number,
            previewImageUrl: Lampa.TMDB.image(`t/p/w300${tmdbEpisode.still_path}`),
        }));
    }

    formatOroroShow(ororoShow) {
        ororoShow.episodesBySeasons = ororoShow.episodes
            .map((episode) => ({
                ...episode,
                airDate: episode.airdate,
                episodeNumber: parseInt(episode.number, 10),
                seasonNumber: episode.season,
            }))
            .sort((a, b) => (a.episodeNumber > b.episodeNumber ? 1 : -1))
            .reduce((memo, episode) => {
                const season = episode.seasonNumber;
                memo[season] = memo[season] ?? [];
                memo[season].push(episode);
                return memo;
            }, {});
        ororoShow.seasons = Object.keys(ororoShow.episodesBySeasons)
            .map((seasonNumber) => parseInt(seasonNumber, 10))
            .sort((a, b) => (a > b ? 1 : -1));
        return ororoShow;
    }

    getFilter$(ororoShow) {
        const validSeasons = ororoShow.seasons.filter((seasonNumber) => seasonNumber > 0);
        const selectedSeasonId = validSeasons[0];
        const filterItems = validSeasons.map((seasonNumber) => {
            const id = seasonNumber;
            return {
                id,
                title: `${translate(TEXTS.SeasonTitle)} ${seasonNumber}`,
                seasonNumber: seasonNumber,
                isSelected: id === selectedSeasonId,
            };
        });
        const initialFilterItem = filterItems.find(({ isSelected }) => isSelected);
        this.filterSubject = new BehaviorSubject(initialFilterItem);
        this.filter.set(FILTER_KEY, filterItems);
        // hide filter search button
        this.filter.render().find('.filter--search').addClass('hide');
        this.filter.onSelect = (type, selectedFilterItem) => {
            Lampa.Select.close();
            this.filterSubject.next(selectedFilterItem);
        };
        return this.filterSubject.pipe(
            tap((selectedFilterItem) => this.setSelectedFilterText(selectedFilterItem?.title)),
            filter((selectedFilterItem) => !!selectedFilterItem),
            distinctUntilKeyChanged('id'),
        );
    }

    initBody() {
        // add scroll smoothness
        this.scroll.body().addClass('torrent-list');
        this.explorer.appendFiles(this.scroll.render());
        this.explorer.appendHead(this.filter.render());
        Lampa.Controller.enable(CONTENT_CONTROLLER_NAME);
    }

    renderError(error) {
        this.explorer.clearHead();
        this.replaceBodyTemplate(EMPTY_TEMPLATE, {
            title: translate(TEXTS.Oops),
            description: error.message,
        });
    }

    init() {
        this.initController();
        this.initBody();
        this.initFlow(this.movie);
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

    setActivityIsLoading(isLoading) {
        this.activity.loader(isLoading);
        if (!isLoading) {
            this.activity.toggle();
        }
    }

    replaceBodyTemplate(template, data) {
        this.scroll.clear();
        this.scroll.reset();
        this.scroll.body().append(getTemplate(template, data));
    }

    setBodyIsLoading(isLoading) {
        if (!isLoading) return;
        this.replaceBodyTemplate(CONTENT_LOADING_TEMPLATE);
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
