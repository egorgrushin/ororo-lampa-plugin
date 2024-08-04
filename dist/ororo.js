(function () {
  'use strict';

  function _classCallCheck(a, n) {
    if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
  }
  function _defineProperties(e, r) {
    for (var t = 0; t < r.length; t++) {
      var o = r[t];
      o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o);
    }
  }
  function _createClass(e, r, t) {
    return r && _defineProperties(e.prototype, r), Object.defineProperty(e, "prototype", {
      writable: !1
    }), e;
  }
  function _defineProperty(e, r, t) {
    return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
      value: t,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[r] = t, e;
  }
  function _toPrimitive(t, r) {
    if ("object" != typeof t || !t) return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
      var i = e.call(t, r || "default");
      if ("object" != typeof i) return i;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
  }
  function _toPropertyKey(t) {
    var i = _toPrimitive(t, "string");
    return "symbol" == typeof i ? i : i + "";
  }

  var getCurrentActivity = function getCurrentActivity() {
    return Lampa.Activity.active().activity;
  };
  var translate = function translate(key) {
    return Lampa.Lang.translate(key);
  };

  var PLUGIN_NAME = 'ororo';
  var COMPONENT_NAME = 'ororo';
  var OPEN_BUTTON_ID = "".concat(PLUGIN_NAME, "-open-button");
  var FILTER_SEASONS_KEY = "seasons";
  var CONTENT_CONTROLLER_NAME = "content";

  var TEMPLATE_NAMES = {
    ContentLoading: "".concat(PLUGIN_NAME, "-content-loading")
  };
  var CONTENT_LOADING_TEMPLATE = "\n    <div class=\"online-empty\">\n        <div class=\"broadcast__scan\"><div></div></div>\n        <div class=\"online-empty__templates\">\n            <div class=\"online-empty-template selector\">\n                <div class=\"online-empty-template__ico\"></div>\n                <div class=\"online-empty-template__body\"></div>\n            </div>\n            <div class=\"online-empty-template\">\n                <div class=\"online-empty-template__ico\"></div>\n                <div class=\"online-empty-template__body\"></div>\n            </div>\n            <div class=\"online-empty-template\">\n                <div class=\"online-empty-template__ico\"></div>\n                <div class=\"online-empty-template__body\"></div>\n            </div>\n        </div>\n    </div>\n";
  var resetTemplates = function resetTemplates() {
    Lampa.Template.add(TEMPLATE_NAMES.ContentLoading, CONTENT_LOADING_TEMPLATE);
  };
  var getTemplate = function getTemplate(name) {
    return Lampa.Template.get(name);
  };

  var TEXTS = {
    Title: "".concat(PLUGIN_NAME, "-title"),
    EmptyFilter: "".concat(PLUGIN_NAME, "-empty-filter")
  };
  var registerTexts = function registerTexts() {
    Lampa.Lang.add(_defineProperty(_defineProperty({}, TEXTS.Title, {
      ru: 'Ororo.tv',
      en: 'Ororo.tv'
    }), TEXTS.EmptyFilter, {
      ru: 'Empty',
      en: 'Empty'
    }));
  };

  var OroroComponent = /*#__PURE__*/function () {
    function OroroComponent(input) {
      _classCallCheck(this, OroroComponent);
      this.movie = input.movie;
      this.request = new Lampa.Reguest();
      this.scroll = new Lampa.Scroll({
        mask: true,
        over: true
      });
      this.explorer = new Lampa.Explorer(input.movie);
      this.filter = new Lampa.Filter(input.movie);
      this.isInitialized = false;
      this.last = undefined;
      this.activity = undefined;
      console.log(input.movie);
    }
    return _createClass(OroroComponent, [{
      key: "start",
      value: function start() {
        if (getCurrentActivity() !== this.activity) return;
        if (!this.isInitialized) {
          this.initialize();
        }
        Lampa.Background.immediately(Lampa.Utils.cardImgBackgroundBlur(this.movie));
        this.initController();
      }
    }, {
      key: "setChoice",
      value: function setChoice(seasonSelectItem) {
        console.log(seasonSelectItem);
      }
    }, {
      key: "initializeSeasonSelector",
      value: function initializeSeasonSelector(seasons) {
        var _seasonSelectItems$fi, _seasonSelectItems$fi2;
        var selectedSeasonId = '';
        var seasonSelectItems = seasons.map(function (season) {
          return {
            id: season.id,
            title: season.title,
            isSelected: season.id === selectedSeasonId
          };
        });
        var selectedSeasonTitle = (_seasonSelectItems$fi = (_seasonSelectItems$fi2 = seasonSelectItems.find(function (_ref) {
          var isSelected = _ref.isSelected;
          return isSelected;
        })) === null || _seasonSelectItems$fi2 === void 0 ? void 0 : _seasonSelectItems$fi2.title) !== null && _seasonSelectItems$fi !== void 0 ? _seasonSelectItems$fi : translate(TEXTS.EmptyFilter);
        this.filter.set(FILTER_SEASONS_KEY, seasonSelectItems);
        this.filter.chosen(FILTER_SEASONS_KEY, selectedSeasonTitle);
      }
    }, {
      key: "initialize",
      value: function initialize() {
        var _this = this;
        this.filter.onSelect = function (type, seasonSelectItem) {
          _this.setChoice(seasonSelectItem);
          Lampa.Select.close();
        };
        // add scroll smoothness
        this.scroll.body().addClass('torrent-list');
        this.explorer.appendFiles(this.scroll.render());
        this.explorer.appendHead(this.filter.render());
        Lampa.Controller.enable(CONTENT_CONTROLLER_NAME);
        this.scroll.minus(this.explorer.render().find('.explorer__files-head'));
        this.scroll.body().append(getTemplate(TEMPLATE_NAMES.ContentLoading));
        this.isInitialized = true;
      }
    }, {
      key: "create",
      value: function create() {
        this.render();
      }
    }, {
      key: "render",
      value: function render() {
        this.explorer.render();
      }
    }, {
      key: "play",
      value: function play() {
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
    }, {
      key: "setIsLoading",
      value: function setIsLoading(isLoading) {
        this.activity.loader(isLoading);
        if (!isLoading) {
          this.activity.toggle();
        }
      }
    }, {
      key: "initController",
      value: function initController() {
        Lampa.Controller.add(CONTENT_CONTROLLER_NAME, {
          toggle: function toggle() {
            var _this$last;
            Lampa.Controller.collectionSet(this.scroll.render(), this.explorer.render());
            Lampa.Controller.collectionFocus((_this$last = this.last) !== null && _this$last !== void 0 ? _this$last : false, this.scroll.render());
          },
          up: function up() {
            if (Navigator.canmove('up')) return Navigator.move('up');
            Lampa.Controller.toggle('head');
          },
          down: function down() {
            Navigator.move('down');
          },
          right: function right() {
            if (Navigator.canmove('right')) return Navigator.move('right');
            this.filter.show(translate('title_filter'), FILTER_SEASONS_KEY);
          },
          left: function left() {
            if (Navigator.canmove('left')) return Navigator.move('left');
            Lampa.Controller.toggle('menu');
          },
          back: function back() {
            Lampa.Activity.backward();
          }
        });
        Lampa.Controller.toggle(CONTENT_CONTROLLER_NAME);
      }
    }]);
  }();

  var open = function open(cardData) {
    resetTemplates();
    Lampa.Activity.push({
      url: '',
      title: translate(TEXTS.Title),
      component: COMPONENT_NAME,
      movie: cardData.movie,
      page: 1
    });
  };
  var addOpenButtonToCard = function addOpenButtonToCard(manifest, whereToRender, cardData) {
    if (whereToRender.find("#".concat(OPEN_BUTTON_ID)).length) return;
    var button = $('<div></div>');
    button.attr('id', OPEN_BUTTON_ID);
    // required classes for correct button rendering
    button.addClass('full-start__button selector');
    button.attr('data-subtitle', "".concat(manifest.name, " v").concat(manifest.version));
    button.text(translate(TEXTS.Title));
    button.on('hover:enter', function () {
      return open(cardData);
    });
    whereToRender.before(button);
  };
  var initPlugin = function initPlugin() {
    registerTexts();
    var manifest = {
      type: 'video',
      version: '0.0.2',
      name: PLUGIN_NAME,
      description: 'Плагин для просмотра сериалов и фильмов на сервисе ororo.tv',
      component: COMPONENT_NAME
    };
    Lampa.Component.add(COMPONENT_NAME, OroroComponent);
    Lampa.Manifest.plugins = manifest;
    Lampa.Listener.follow('full', function (e) {
      if (e.type !== 'complite') return;
      var whereToRender = e.object.activity.render().find('.button--play');
      addOpenButtonToCard(manifest, whereToRender, e.data);
    });
    window.is_ororo_plugin_ready = true;
  };
  if (!window.is_ororo_plugin_ready) {
    initPlugin();
  }

})();
