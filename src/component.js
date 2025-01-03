import { getCurrentActivity, getCurrentLanguage, pad, translate } from './utils';
import { getTemplate } from './templates';
import {
    CONTENT_CONTROLLER_NAME,
    FILTER_KEY,
    LOGIN_SETTING_PARAM,
    ORORO_API_KEY,
    PASSWORD_SETTING_PARAM,
} from './constants';
import { TEXTS } from './texts';
import { BehaviorSubject, from, Observable, of } from 'rxjs';
import { catchError, distinctUntilKeyChanged, filter, map, switchMap, tap } from 'rxjs/operators';
import { CONTENT_LOADING_TEMPLATE, EMPTY_TEMPLATE, EPISODE_TEMPLATE } from './components';
import { throwError } from 'rxjs/internal/observable/throwError';
import { EMPTY } from 'rxjs/internal/observable/empty';
import { createAffectLoadingState, switchWith } from './rxjs';

export class OroroComponent {
    constructor(input) {
        this.movie = input.movie;
        this.isShow = !!this.movie.seasons;
        this.request = new Lampa.Reguest();
        this.scroll = new Lampa.Scroll({ mask: true, over: true });
        this.explorer = new Lampa.Explorer(input);
        this.filter = new Lampa.Filter(input);
        this.isInit = false;
        this.last = undefined;
        this.activity = undefined;
        this.ororoApi = window[ORORO_API_KEY];
        const login = Lampa.Storage.field(LOGIN_SETTING_PARAM);
        const password = Lampa.Storage.field(PASSWORD_SETTING_PARAM);
        this.ororoApi.applySettings(login, password);
    }

    start() {
        if (getCurrentActivity() !== this.activity) return;
        if (!this.isInit) {
            // must be first to prevent infinite calls
            this.isInit = true;
            this.init();
        }
        Lampa.Background.immediately(Lampa.Utils.cardImgBackgroundBlur(this.movie));
        this.initController();
    }

    toPlayElement = (enrichedEpisode) => {
        return {
            title: enrichedEpisode.name,
            url: enrichedEpisode.downloadUrl,
            // quality: file.qualitys,
            timeline: enrichedEpisode.timeline,
            // [{index:integer, label:string, url:string}]
            subtitles: enrichedEpisode.subtitles.map((subtitle, index) => ({
                index,
                label: subtitle.lang,
                url: subtitle.url,
            })),
            // callback: file.mark,
        };
    };

    mapTmdbMovieToEpisode(movie) {
        return {
            ...movie,
            isShow: false,
            airDate: movie.release_date,
            episodeNumber: 1,
            previewImageUrl: Lampa.TMDB.image(`t/p/w300${movie.backdrop_path}`),
        };
    }

    fetchTmdbEpisodes$(seasonNumber) {
        const tmdbUrl = `tv/${this.movie.id}/season/${seasonNumber}?api_key=${Lampa.TMDB.key()}&language=${getCurrentLanguage()}`;
        const url = Lampa.TMDB.api(tmdbUrl);
        return this.request$(url);
    }

    setSelectedFilterText(text) {
        this.filter.chosen(FILTER_KEY, [text ?? translate(TEXTS.EmptyFilter)]);
    }

    async selectEpisode(enrichedEpisode) {
        const episode = enrichedEpisode.isShow ? await this.ororoApi.getEpisode(enrichedEpisode) : enrichedEpisode;
        enrichedEpisode.downloadUrl = episode.download_url;
        enrichedEpisode.subtitles = episode.subtitles;
        const playElement = this.toPlayElement(enrichedEpisode);
        Lampa.Player.play(playElement);
    }

    mergeEpisodes(ororoEpisodes, tmdbEpisodes) {
        const tmdbEpisodesMap = tmdbEpisodes.reduce((memo, tmdbEpisode) => {
            memo[tmdbEpisode.episodeNumber] = tmdbEpisode;
            return memo;
        }, {});

        return ororoEpisodes.map((episode) => {
            const episodeNumber = episode.episodeNumber;
            const tmdbEpisode = tmdbEpisodesMap[episodeNumber];
            const timelineHash = Lampa.Utils.hash([episode.seasonNumber, episodeNumber, episode.original_title]);
            const timeline = Lampa.Timeline.view(timelineHash);
            const duration = tmdbEpisode ? Lampa.Utils.secondsToTime(tmdbEpisode.runtime * 60, true) : undefined;
            const airDate = tmdbEpisode?.airDate ?? episode.airDate;
            return {
                ...episode,
                timelineHash,
                timeline,
                episodeNumberFormatted: episode.isShow ? pad(episodeNumber, 2) : '',
                duration,
                releaseDate: Lampa.Utils.parseTime(airDate).full,
                previewImageUrl: tmdbEpisode?.previewImageUrl,
            };
        });
    }

    setEpisodes(episodes) {
        this.scroll.clear();
        episodes.forEach((episode) => {
            const episodeHtml = getTemplate(EPISODE_TEMPLATE, episode);
            episodeHtml
                .find(`.${EPISODE_TEMPLATE.classNames.timeline}`)
                .append(Lampa.Timeline.render(episode.timeline));

            episodeHtml
                .on('hover:focus', (e) => this.scroll.update($(e.target), true))
                .on('hover:enter', () => this.selectEpisode(episode));

            const imgRef = episodeHtml.find(`.${EPISODE_TEMPLATE.classNames.image__background}`)[0];
            imgRef.onerror = () => imgRef.remove();
            imgRef.onload = () => imgRef.addClass(EPISODE_TEMPLATE.classNames.loaded);
            this.scroll.append(episodeHtml);
        });
        Lampa.Controller.enable(CONTENT_CONTROLLER_NAME);
    }

    getOroroFragment$(movie) {
        const isShow = this.isShow;
        const fragments$ = isShow ? this.ororoApi.shows$ : this.ororoApi.movies$;
        return fragments$.pipe(
            catchError(() => throwError(() => new Error(translate(TEXTS.NoOroroAccess)))),
            map((ororoFragments) =>
                ororoFragments.find((ororoFragment) => {
                    const tmdbId = movie.id.toString();
                    const imdbId = movie.imdb_id.replace(/\D+/g, '');
                    return isShow ? ororoFragment.tmdb_id === tmdbId : ororoFragment.imdb_id === imdbId;
                }),
            ),
            switchMap((ororoFragment) => {
                if (!ororoFragment) return throwError(() => new Error(translate(TEXTS.NoOroroShow)));
                const promise = isShow
                    ? this.ororoApi.getShow(ororoFragment.id)
                    : this.ororoApi.getMovie(ororoFragment.id);
                return from(promise);
            }),
            map((ororoFragment) => this.formatOroroFragment(ororoFragment, isShow)),
        );
    }

    getTmdbEpisodes$(ororoFragment, seasonNumber) {
        const isShow = ororoFragment.isShow;
        const tmdbFragment$ = isShow ? this.fetchTmdbEpisodes$(seasonNumber) : of(this.movie);

        return tmdbFragment$.pipe(
            map((tmdbFragment) =>
                isShow ? this.formatTmdbEpisodes(tmdbFragment) : [this.mapTmdbMovieToEpisode(tmdbFragment)],
            ),
        );
    }

    formatTmdbEpisodes(tmdbEpisodes) {
        return tmdbEpisodes.map((tmdbEpisode) => ({
            ...tmdbEpisode,
            isShow: true,
            airDate: tmdbEpisode.air_date,
            episodeNumber: tmdbEpisode.episode_number,
            previewImageUrl: Lampa.TMDB.image(`t/p/w300${tmdbEpisode.still_path}`),
        }));
    }

    getEpisodes$(ororoFragment, seasonNumber) {
        const ororoEpisodes = ororoFragment.episodesBySeasons[seasonNumber];
        return this.getTmdbEpisodes$(ororoFragment, seasonNumber).pipe(
            map((tmdbEpisodes) => this.mergeEpisodes(ororoEpisodes, tmdbEpisodes)),
        );
    }

    initFlow(movie) {
        const affectActivityLoadingState = createAffectLoadingState(({ isLoading }) =>
            this.setActivityIsLoading(isLoading),
        );
        const affectBodyLoadingState = createAffectLoadingState(({ isLoading }) => this.setBodyIsLoading(isLoading));

        this.flowSubscription = of(movie)
            .pipe(
                affectActivityLoadingState(
                    switchMap((movie) => this.getOroroFragment$(movie)),
                    switchWith((ororoFragment) => this.getFilter$(ororoFragment)),
                ),
                affectBodyLoadingState(
                    switchMap(([ororoFragment, { seasonNumber }]) => this.getEpisodes$(ororoFragment, seasonNumber)),
                ),
                catchError((error) => {
                    this.renderError(error);
                    return EMPTY;
                }),
            )
            .subscribe((episodes) => this.setEpisodes(episodes));
    }

    formatEpisodes(ororoEpisodes) {
        return ororoEpisodes.map((episode) => ({
            ...episode,
            isShow: true,
            airDate: episode.airdate,
            episodeNumber: parseInt(episode.number, 10),
            seasonNumber: episode.season,
        }));
    }

    mapOroroMovieToEpisode(ororoFragment) {
        return {
            ...ororoFragment,
            isShow: false,
            airDate: this.movie.release_date,
            episodeNumber: 1,
            seasonNumber: 1,
        };
    }

    formatOroroFragment(ororoFragment, isShow) {
        const episodes = isShow
            ? this.formatEpisodes(ororoFragment.episodes)
            : [this.mapOroroMovieToEpisode(ororoFragment)];
        ororoFragment.isShow = isShow;
        ororoFragment.episodesBySeasons = episodes
            .sort((a, b) => (a.episodeNumber > b.episodeNumber ? 1 : -1))
            .reduce((memo, episode) => {
                const season = episode.seasonNumber;
                memo[season] = memo[season] ?? [];
                memo[season].push(episode);
                return memo;
            }, {});

        ororoFragment.seasons = Object.keys(ororoFragment.episodesBySeasons)
            .map((seasonNumber) => parseInt(seasonNumber, 10))
            .sort((a, b) => (a > b ? 1 : -1));
        return ororoFragment;
    }

    getFilter$(ororoFragment) {
        const validSeasons = ororoFragment.seasons.filter((seasonNumber) => seasonNumber > 0);
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
        if (!ororoFragment.isShow) return of(initialFilterItem);

        this.explorer.appendHead(this.filter.render());
        // hide filter search button
        this.filter.render().find('.filter--search').addClass('hide');
        this.filterSubject = new BehaviorSubject(initialFilterItem);
        this.filter.set(FILTER_KEY, filterItems);
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
        // this line sets height to scroll container. It enables scrolling
        this.scroll.minus(this.explorer.render().find('.explorer__files-head'));
        Lampa.Controller.enable(CONTENT_CONTROLLER_NAME);
        this.activity.toggle();
    }

    renderError(error) {
        this.explorer.clearHead();
        this.replaceBodyTemplate(EMPTY_TEMPLATE, {
            title: translate(TEXTS.Oops),
            description: error.message,
        });
    }

    init() {
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
                if (!this.isShow) return;
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
    }

    pause() {}

    stop() {}

    destroy() {
        this.flowSubscription?.unsubscribe();
        this.request.clear();
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
