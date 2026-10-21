// ==UserScript==
// @name         Illyriad True Dark Mode + Auto Contrast + Resource Rate Colorizer [PRAISE AEROIS]
// @namespace    http://tampermonkey.net/
// @version      6.6
// @description  Graphite dark theme with blue links, white text, native level popups, restored prestige buttons, zebra striping, and a clean red Contribute button. Button toggles between Graphite and default.
// @author       You
// @match        https://*.illyriad.co.uk/*
// @match        http://*.illyriad.co.uk/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    const CSS_ID = 'illy-dark-mode-styles';
    const STORE_KEY = 'illy_theme_mode';

    const MIN_CONTRAST = 3.5;
    const TARGET_CONTRAST = 4.5;

    const SKIP_SELECTOR = '#townview, #cityview, #map, #mapview, .town-map, .city-map';

    const EXCLUDE_FROM_PROCESSING_SELECTOR = [
        '[class*="level" i]',
        '[id*="level" i]',
        '[class*="lvl" i]',
        '[id*="lvl" i]',
        '[class*="bnum" i]',
        '[id*="bnum" i]',
        '[class*="town" i][class*="num" i]',
        '[class*="map" i][class*="num" i]',
        '[class*="tile" i][class*="num" i]',
        '[class*="map" i][class*="level" i]',
        '[class*="tile" i][class*="level" i]',
        '[class*="building" i][class*="level" i]',
        '[class*="bldg" i][class*="level" i]',
        '.lvl',
        '.lvlBox',
        '.lvlbox',
        '.levelBox',
        '.levelbox',
        '.buildingLevel',
        '.building-level',
        '.tileLevel',
        '.tile-level',
        '.townLevel',
        '.town-level',
        '[class*="prestige" i]',
        '[id*="prestige" i]',
        '[class*="award" i]',
        '[id*="award" i]',
        '[class*="medal" i]',
        '[id*="medal" i]',
        '[class*="achievement" i]',
        '[id*="achievement" i]',
        '[class*="trophy" i]',
        '[id*="trophy" i]',
        '[class*="paypal" i]',
        '[id*="paypal" i]',
        'input[src*="paypal" i]',
        'img[src*="paypal" i]',
        'a[href*="paypal" i]',
        '.illy-spend-red-pill',
        '.illy-spend-blue-pill',
        '.illy-pill-wrapper'
    ].join(', ');

    /* ============================================================
       THEME PALETTE (Graphite)
       ============================================================
       hoverDark = a darker version of the theme's panel/row-hover
       colour, used for the town/map tile hover effect.            */

    const THEMES = {
        graphite: {
            label: 'Graphite', icon: '',
            white: { r: 242, g: 242, b: 243, a: 1 },
            linkRgb: { r: 108, g: 178, b: 255, a: 1 },
            pageBg: { r: 28, g: 28, b: 30, a: 1 },
            panelBg: { r: 44, g: 44, b: 46, a: 1 },
            neutralLight: { r: 216, g: 216, b: 218, a: 1 },
            neutralDark: { r: 28, g: 28, b: 30, a: 1 },
            page: '#1c1c1e', panel: '#2c2c2e', panelAlt: '#3a3a3c', panelHead: '#3a3a3c',
            rowOdd: '#2e2e30', rowEven: '#242426', rowHover: '#3c3c3f',
            border: '#48484a', borderSoft: '#5a5a5d',
            text: '#f2f2f3', textDim: '#d8d8da', placeholder: '#8e8e93',
            link: '#6cb2ff', linkHover: '#9fcbff',
            scrollTrack: '#1c1c1e', scrollThumb: '#48484a',
            inputBg: '#323234', activeTab: '#48484a',
            hoverDark: 'rgba(0, 0, 0, 0.4)'
        }
    };

    let ACTIVE = THEMES.graphite;

    let WHITE           = ACTIVE.white;
    let LINK_BLUE       = ACTIVE.linkRgb;
    let PAGE_BG         = ACTIVE.pageBg;
    let PANEL_BG        = ACTIVE.panelBg;
    let NEUTRAL_LIGHT   = ACTIVE.neutralLight;
    let NEUTRAL_DARK    = ACTIVE.neutralDark;

    function bindConstants(theme) {
        ACTIVE        = theme;
        WHITE         = theme.white;
        LINK_BLUE     = theme.linkRgb;
        PAGE_BG       = theme.pageBg;
        PANEL_BG      = theme.panelBg;
        NEUTRAL_LIGHT = theme.neutralLight;
        NEUTRAL_DARK  = theme.neutralDark;
    }

    const A_BG = 'data-illy-bg';
    const A_IMG = 'data-illy-noimg';
    const A_FG = 'data-illy-fg';
    const A_HALO = 'data-illy-halo';
    const A_STYLED = 'data-illy-styled';
    const A_TOP = 'data-illy-topclear';

    /* ----------------------------------------------------------------
       Build the full stylesheet for the Graphite theme.
       ---------------------------------------------------------------- */
    function buildThemeCSS(t) {
        return `
        :root { color-scheme: dark; }

        html { background-color: ${t.page} !important; }
        body {
            background-color: ${t.page} !important;
            color: ${t.textDim} !important;
        }
        #topbar, #header, #cmdbar {
            background-color: ${t.panel} !important;
            background-image: none !important;
        }

        html, body, #page-wrapper, #content, #sidecontainer, #maincontainer {
            background-color: ${t.page} !important;
            background-image: none !important;
            color: ${t.text} !important;
        }

        #header, #footer, #sidebar, #topbar, #cmdbar,
        #Notifications, #NextEvents, #Friends,
        .panel, .box, .ui-widget-content, .ui-widget-header, .ui-corner-all, .ui-dialog,
        table, td, th, tbody, thead, fieldset, legend {
            background-color: ${t.panel} !important;
            background-image: none !important;
            border-color: ${t.border} !important;
            color: ${t.text} !important;
        }

        tr { background-color: transparent !important; }
        tbody tr:nth-child(even), tr.even, tr.alt, tr[class*="alt"] {
            background-color: ${t.rowEven} !important;
        }
        tbody tr:nth-child(odd), tr.odd {
            background-color: ${t.rowOdd} !important;
        }
        tr:hover { background-color: ${t.rowHover} !important; }
        tbody tr:nth-child(even) td,
        tbody tr:nth-child(odd) td { background-color: inherit !important; }

        #tooltip, #divTooltip, #tt, #itemTooltip, #hoverTooltip,
        .tooltip, .tooltip-content, .ui-tooltip, .ui-tooltip-content,
        [class*="tooltip"], [id*="tooltip"], [class*="Tooltip"], [id*="Tooltip"],
        [class*="popup"], [id*="popup"],
        [class*="research"], [id*="research"],
        [class*="unitinfo"], [id*="unitinfo"],
        [class*="infoPanel"], [id*="infoPanel"],
        .ui-dialog-content, .ui-widget-content {
            background-color: ${t.panel} !important;
            background-image: none !important;
            color: ${t.text} !important;
            border-color: ${t.borderSoft} !important;
        }

        .ui-tabs-nav, .ui-tabs-nav li, .ui-tabs-anchor,
        .panel-header, .box-header, .head, header, [class*="header"] {
            background-color: ${t.panelHead} !important;
            background-image: none !important;
            color: ${t.text} !important;
            border-color: ${t.border} !important;
        }
        .ui-tabs-nav li.ui-tabs-active { background-color: ${t.activeTab} !important; }
        .ui-tabs-nav li.ui-tabs-active a { color: ${t.link} !important; }

        h1, h2, h3, h4, h5, h6, strong, b, .title, label {
            color: ${t.text} !important;
        }

        a, a:link, a:visited, a:any-link,
        a *, a:link *, a:visited *,
        body a, body a:link, body a:visited,
        html body a, html body a *,
        span a, div a, td a, li a, p a,
        #Notifications a, #NextEvents a, #Friends a,
        #Notifications a *, #NextEvents a *, #Friends a *,
        [class*="tooltip"] a, [id*="tooltip"] a,
        [class*="popup"] a, [id*="popup"] a,
        [class*="research"] a, [id*="research"] a,
        .ui-tooltip a, .ui-dialog a, .ui-widget-content a,
        [class*="tooltip"] a *, [id*="tooltip"] a *,
        .ui-dialog a * {
            color: ${t.link} !important;
            text-shadow: none !important;
        }
        a:hover, a:active, a:focus,
        a:hover *, a:active *, a:focus *,
        body a:hover, body a:active,
        [class*="tooltip"] a:hover, [id*="tooltip"] a:hover,
        [class*="popup"] a:hover, [id*="popup"] a:hover,
        .ui-tooltip a:hover, .ui-dialog a:hover {
            color: ${t.linkHover} !important;
        }

        select, option, #ddlTowns, select#ddlTowns, select#ddlTowns option,
        input, textarea, .select2-container, .select2-selection {
            background-color: ${t.inputBg} !important;
            color: ${t.text} !important;
            border: 1px solid ${t.borderSoft} !important;
            background-image: none !important;
        }
        input[type="checkbox"], input[type="radio"] {
            background-color: transparent !important;
            border: none !important;
        }
        ::placeholder { color: ${t.placeholder} !important; opacity: 1 !important; }
        input::placeholder, textarea::placeholder {
            color: ${t.placeholder} !important;
            opacity: 1 !important;
        }

        #ChatContainer, #ChatWindow, #ChatTabs, [id*="Chat"], [id*="chat"],
        .chat-message, .chat-text, .chatlog, #chatlog, #chatbox {
            background-color: ${t.page} !important;
        }
        [id*="Chat"] span, [id*="chat"] span,
        [id*="Chat"] td, [id*="chat"] td {
            color: ${t.text} !important;
        }

        .res-rate-negative, .res-rate-negative * {
            color: #ef4444 !important;
            font-weight: bold !important;
        }
        .res-rate-positive, .res-rate-positive * {
            color: #22c55e !important;
            font-weight: bold !important;
        }

        ::-webkit-scrollbar { width: 10px; height: 10px; }
        ::-webkit-scrollbar-track { background: ${t.scrollTrack}; }
        ::-webkit-scrollbar-thumb { background: ${t.scrollThumb}; border-radius: 5px; }

        [${A_BG}][${A_BG}][${A_BG}] {
            background-color: ${t.panel} !important;
            background-image: none !important;
        }
        [${A_IMG}][${A_IMG}][${A_IMG}] { background-image: none !important; }
        [${A_FG}][${A_FG}][${A_FG}] { color: var(--illy-fg) !important; }
        [${A_HALO}][${A_HALO}] {
            text-shadow: 0 0 2px #000, 0 0 5px #000 !important;
        }

        [class*="level" i],
        [id*="level" i],
        [class*="lvl" i],
        [id*="lvl" i],
        [class*="bnum" i],
        [id*="bnum" i],
        .lvl, .lvlBox, .lvlbox, .levelBox, .levelbox,
        .buildingLevel, .building-level,
        .tileLevel, .tile-level,
        .townLevel, .town-level {
            background-image: initial !important;
            color: #ffffff !important;
            font-weight: bold !important;
            text-shadow: 0 1px 1px rgba(0,0,0,0.9) !important;
        }

        [class*="level" i] *,
        [class*="lvl" i] *,
        [class*="bnum" i] *,
        .lvl *, .lvlBox *, .lvlbox *,
        .levelBox *, .levelbox *,
        .buildingLevel *, .building-level *,
        .tileLevel *, .tile-level * {
            color: #ffffff !important;
            text-shadow: 0 1px 1px rgba(0,0,0,0.9) !important;
        }

        #topbar [class*="prestige" i],
        #topbar [id*="prestige" i],
        #header [class*="prestige" i],
        #header [id*="prestige" i],
        a[href*="Prestige"] img,
        [class*="crown" i] {
            border-radius: 4px !important;
        }

        .illy-pill-wrapper {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 5px !important;
            padding: 1px 6px !important;
            box-sizing: border-box !important;
            border-radius: 3px !important;
            line-height: 16px !important;
            vertical-align: middle !important;
            text-decoration: none !important;
            font-weight: bold !important;
            text-shadow: 1px 1px 0 rgba(0,0,0,0.75) !important;
            border: 0 !important;
            width: auto !important;
            max-width: max-content !important;
            box-shadow: none !important;
            isolation: isolate !important;
        }

        .illy-pill-wrapper.illy-spend-red-pill {
            background-color: #8a1212 !important;
            background-image: linear-gradient(to bottom, #a81818 0%, #7a0f0f 55%, #5c0a0a 100%) !important;
            border: 0 !important;
        }
        .illy-pill-wrapper.illy-spend-blue-pill {
            background-color: #3a4a68 !important;
            background-image: linear-gradient(to bottom, #4a5c7d 0%, #374763 55%, #2a374f 100%) !important;
            border: 0 !important;
        }

        .illy-pill-wrapper * {
            color: #ffffff !important;
            text-shadow: 1px 1px 0 rgba(0,0,0,0.75) !important;
        }

        .illy-pill-wrapper img {
            vertical-align: middle !important;
            margin: 0 !important;
            filter: none !important;
            display: inline-block !important;
            order: 2 !important;
            width: 16px !important;
            height: 16px !important;
        }

        .illy-spend-red-pill {
            background-color: #8a1212 !important;
            background-image: linear-gradient(to bottom, #a81818 0%, #7a0f0f 55%, #5c0a0a 100%) !important;
            border: 0 !important;
        }
        .illy-spend-blue-pill {
            background-color: #3a4a68 !important;
            background-image: linear-gradient(to bottom, #4a5c7d 0%, #374763 55%, #2a374f 100%) !important;
            border: 0 !important;
        }

        td .illy-pill-wrapper.illy-spend-red-pill {
            background-color: #8a1212 !important;
            background-image: linear-gradient(to bottom, #a81818 0%, #7a0f0f 55%, #5c0a0a 100%) !important;
            border: 0 !important;
        }
        td .illy-pill-wrapper.illy-spend-blue-pill {
            background-color: #3a4a68 !important;
            background-image: linear-gradient(to bottom, #4a5c7d 0%, #374763 55%, #2a374f 100%) !important;
            border: 0 !important;
        }

        td:has(> .illy-pill-wrapper) {
            background-color: transparent !important;
            background-image: none !important;
            border: 0 !important;
        }

        td > .illy-pill-wrapper {
            width: max-content !important;
            max-width: 100% !important;
        }

        a > .illy-pill-wrapper.illy-spend-red-pill,
        button > .illy-pill-wrapper.illy-spend-red-pill,
        [onclick] > .illy-pill-wrapper.illy-spend-red-pill,
        div > .illy-pill-wrapper.illy-contribute-pill {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            gap: 8px !important;
            padding: 4px 10px !important;
            width: 100% !important;
            max-width: none !important;
            box-sizing: border-box !important;
            background-color: #8a1212 !important;
            background-image: linear-gradient(to bottom, #a81818 0%, #7a0f0f 55%, #5c0a0a 100%) !important;
            border: 0 !important;
            color: #ffffff !important;
            border-radius: 3px !important;
        }

        a > .illy-pill-wrapper.illy-spend-red-pill img,
        button > .illy-pill-wrapper.illy-spend-red-pill img,
        [onclick] > .illy-pill-wrapper.illy-spend-red-pill img,
        div > .illy-pill-wrapper.illy-contribute-pill img {
            width: 18px !important;
            height: 18px !important;
            flex: 0 0 auto !important;
        }

        [class*="disabled"] .illy-pill-wrapper,
        .disabled-prestige {
            background-image: none !important;
            background-color: ${t.border} !important;
            border: 0 !important;
            color: ${t.placeholder} !important;
            box-shadow: none !important;
        }

        .illy-pill-wrapper.illy-spend-red-pill.illy-contribute-pill {
            border: 1px solid #c9a227 !important;
            box-shadow: inset 0 0 0 1px rgba(255, 215, 120, 0.25) !important;
        }

        .illy-contribute-clear.illy-contribute-clear.illy-contribute-clear {
            background-color: transparent !important;
            background-image: none !important;
            box-shadow: none !important;
            border: 0 !important;
            outline: 0 !important;
        }

        [data-illy-topclear][data-illy-topclear][data-illy-topclear] {
            background-color: transparent !important;
        }

        #townview, #cityview, #map, #mapview, .town-map, .city-map,
        #townview *, #cityview *, #mapview * {
            background-color: transparent !important;
            background-image: initial !important;
            filter: none !important;
        }

        /* ------------------------------------------------------------
           TOWN / MAP HOVER: darken instead of the browser's white ring
           ------------------------------------------------------------
           Instead of the native outline / white highlight, hovering a
           tile, building or plot tints it with the theme's hoverDark
           overlay and dims its contents slightly so the effect reads
           as "pressed into the page" rather than "lit up".          */
        #townview *, #cityview *, #map *, #mapview *,
        .town-map *, .city-map *,
        [class*="tile" i], [class*="tile" i] *,
        [class*="plot" i], [class*="plot" i] *,
        [class*="building" i], [class*="building" i] *,
        [class*="bldg" i], [class*="bldg" i] *,
        [class*="town" i] [class*="tile" i],
        [class*="town" i] [class*="plot" i],
        [class*="town" i] [class*="square" i],
        [class*="map" i] [class*="tile" i],
        [class*="map" i] [class*="plot" i] {
            outline: none !important;
            outline-offset: 0 !important;
            box-shadow: none !important;
            -webkit-tap-highlight-color: transparent !important;
            transition: background-color 0.12s ease, filter 0.12s ease !important;
        }

        #townview *:hover, #cityview *:hover,
        #map *:hover, #mapview *:hover,
        .town-map *:hover, .city-map *:hover,
        [class*="tile" i]:hover, [class*="tile" i] *:hover,
        [class*="plot" i]:hover, [class*="plot" i] *:hover,
        [class*="building" i]:hover, [class*="building" i] *:hover,
        [class*="bldg" i]:hover, [class*="bldg" i] *:hover,
        [class*="town" i] [class*="tile" i]:hover,
        [class*="town" i] [class*="plot" i]:hover,
        [class*="town" i] [class*="square" i]:hover,
        [class*="map" i] [class*="tile" i]:hover,
        [class*="map" i] [class*="plot" i]:hover {
            outline: none !important;
            outline-offset: 0 !important;
            box-shadow: none !important;
            border-color: transparent !important;
            background-color: ${t.hoverDark} !important;
            background-image: none !important;
            filter: brightness(0.78) saturate(0.9) !important;
        }

        #townview *:focus, #cityview *:focus,
        #map *:focus, #mapview *:focus,
        .town-map *:focus, .city-map *:focus,
        [class*="tile" i]:focus, [class*="building" i]:focus,
        [class*="bldg" i]:focus, [class*="plot" i]:focus {
            outline: none !important;
            outline-offset: 0 !important;
            box-shadow: none !important;
        }

        /* Kill the browser's default focus ring everywhere on the page
           (the script already manages contrast, so the ring is redundant). */
        *:focus { outline: none !important; }
        *:focus-visible { outline: none !important; }

        #illy-dark-toggle { color-scheme: dark !important; }
        `;
    }

    function parseColor(s) {
        const m = s && s.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+\%?))?\s*\)/);
        if (!m) return null;
        let a = 1;
        if (m[4] !== undefined) a = m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
        return { r: +m[1], g: +m[2], b: +m[3], a };
    }
    function blend(top, bottom) {
        const a = top.a;
        return {
            r: top.r * a + bottom.r * (1 - a),
            g: top.g * a + bottom.g * (1 - a),
            b: top.b * a + bottom.b * (1 - a),
            a: 1
        };
    }
    function lum(c) {
        const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
        return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
    }
    function contrast(a, b) {
        const l1 = lum(a), l2 = lum(b);
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    }
    const isLight = c => (c.r * 299 + c.g * 587 + c.b * 114) / 1000 > 150;

    function rgbToHsl(c) {
        const r = c.r / 255, g = c.g / 255, b = c.b / 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0;
        const l = (max + min) / 2;
        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
            else if (max === g) h = (b - r) / d + 2;
            else h = (r - g) / d + 4;
            h /= 6;
        }
        return [h, s, l];
    }
    function hslToRgb(h, s, l) {
        const hue = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        if (s === 0) { const v = l * 255; return { r: v, g: v, b: v, a: 1 }; }
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
        return { r: hue(p, q, h + 1 / 3) * 255, g: hue(p, q, h) * 255, b: hue(p, q, h - 1 / 3) * 255, a: 1 };
    }
    const toHex = c => '#' + [c.r, c.g, c.b]
        .map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0'))
        .join('');

    function fixFg(fg, bg) {
        const onDark = lum(bg) < 0.4;
        const [h, s, l0] = rgbToHsl(fg);
        if (s < 0.12) {
            const n = onDark ? NEUTRAL_LIGHT : NEUTRAL_DARK;
            if (contrast(n, bg) >= TARGET_CONTRAST) return n;
            return onDark ? WHITE : { r: 0, g: 0, b: 0, a: 1 };
        }
        let l = l0, out = fg;
        for (let i = 0; i < 40 && contrast(out, bg) < TARGET_CONTRAST; i++) {
            l = onDark ? Math.min(1, l + 0.03) : Math.max(0, l - 0.03);
            out = hslToRgb(h, s, l);
            if (l === 1 || l === 0) break;
        }
        if (contrast(out, bg) < TARGET_CONTRAST) return onDark ? NEUTRAL_LIGHT : NEUTRAL_DARK;
        return out;
    }

    function injectStyle(doc, theme) {
        if (!doc || !doc.documentElement) return;
        const old = doc.getElementById(CSS_ID);
        if (old) old.remove();
        const style = doc.createElement('style');
        style.id = CSS_ID;
        style.textContent = buildThemeCSS(theme);
        (doc.head || doc.documentElement).appendChild(style);
    }
    function removeStyle(doc) {
        const s = doc && doc.getElementById(CSS_ID);
        if (s) s.remove();
    }
    function dropEmptyAttr(el, name) {
        if (el.hasAttribute(name) && !el.getAttribute(name).trim()) el.removeAttribute(name);
    }

    const origInline = new WeakMap();

    function forceTransparent(el) {
        if (!el.hasAttribute(A_STYLED)) {
            origInline.set(el, {
                bg: [el.style.getPropertyValue('background-color'), el.style.getPropertyPriority('background-color')],
                img: [el.style.getPropertyValue('background-image'), el.style.getPropertyPriority('background-image')]
            });
            el.setAttribute(A_STYLED, '1');
        }
        el.style.setProperty('background-color', 'transparent', 'important');
        el.style.setProperty('background-image', 'none', 'important');
    }

    function restoreInline(el) {
        const o = origInline.get(el);
        el.style.removeProperty('background-color');
        el.style.removeProperty('background-image');
        if (o) {
            if (o.bg[0]) el.style.setProperty('background-color', o.bg[0], o.bg[1]);
            if (o.img[0]) el.style.setProperty('background-image', o.img[0], o.img[1]);
        }
        origInline.delete(el);
        el.removeAttribute(A_STYLED);
        dropEmptyAttr(el, 'style');
    }

    function revertDom(doc) {
        if (!doc || !doc.querySelectorAll) return;

        doc.querySelectorAll('span.illy-pill-wrapper').forEach(w => {
            const parent = w.parentNode;
            if (!parent) return;
            while (w.firstChild) parent.insertBefore(w.firstChild, w);
            w.remove();
        });

        doc.querySelectorAll('[' + A_STYLED + ']').forEach(restoreInline);

        doc.querySelectorAll('.res-rate-negative, .res-rate-positive, .illy-contribute-clear').forEach(el => {
            el.classList.remove('res-rate-negative', 'res-rate-positive', 'illy-contribute-clear');
            dropEmptyAttr(el, 'class');
        });
    }

    function clearMarkers(doc) {
        if (!doc || !doc.querySelectorAll) return;
        doc.querySelectorAll(`[${A_BG}],[${A_IMG}],[${A_FG}],[${A_HALO}]`).forEach(el => {
            el.removeAttribute(A_BG);
            el.removeAttribute(A_IMG);
            el.removeAttribute(A_HALO);
            if (el.hasAttribute(A_FG)) {
                el.removeAttribute(A_FG);
                el.style.removeProperty('--illy-fg');
                dropEmptyAttr(el, 'style');
            }
        });
        doc.querySelectorAll('[' + A_TOP + ']').forEach(el => el.removeAttribute(A_TOP));
        revertDom(doc);
    }

    const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'LINK', 'META', 'TITLE', 'HEAD', 'TEMPLATE',
        'IMG', 'CANVAS', 'VIDEO', 'AUDIO', 'IFRAME', 'OBJECT', 'EMBED', 'BR', 'HR']);
    const FORM_TAGS = new Set(['TEXTAREA', 'SELECT', 'BUTTON', 'OPTION']);
    const NO_TEXT_INPUT = new Set(['checkbox', 'radio', 'range', 'color', 'file', 'hidden', 'image']);
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const KEEP_IMAGE_SELECTOR = '';
    const FORCE_WHITE_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'STRONG', 'B', 'LABEL', 'TH']);

    const effCache = new WeakMap();

    function hasOwnText(el) {
        for (let n = el.firstChild; n; n = n.nextSibling) {
            if (n.nodeType === 3 && /\S/.test(n.nodeValue)) return true;
        }
        return false;
    }
    function needsFg(el) {
        const t = el.tagName;
        if (t === 'INPUT') return !NO_TEXT_INPUT.has((el.type || '').toLowerCase());
        return FORM_TAGS.has(t) || hasOwnText(el);
    }

    function effOf(el) {
        if (!el || el.nodeType !== 1) return PAGE_BG;
        const hit = effCache.get(el);
        if (hit) return hit;
        const parentEff = effOf(el.parentElement);
        const cs = el.ownerDocument.defaultView.getComputedStyle(el);
        const own = parseColor(cs.backgroundColor);
        let eff = parentEff;
        if (el.hasAttribute(A_BG)) eff = PANEL_BG;
        else if (own && own.a > 0) eff = own.a >= 1 ? own : blend(own, parentEff);
        effCache.set(el, eff);
        return eff;
    }

    function shouldKillImage(el, cs, img) {
        if (KEEP_IMAGE_SELECTOR && el.matches(KEEP_IMAGE_SELECTOR)) return false;
        const w = el.offsetWidth, h = el.offsetHeight;
        if (w < 40 || h < 16) return false;
        const own = hasOwnText(el);
        const text = own || (el.firstElementChild && (el.textContent || '').trim().length > 0);
        if (!text) return false;
        if (img.indexOf('gradient(') !== -1) return true;
        const rep = cs.backgroundRepeat || '';
        return /(^|[\s,])(repeat|repeat-x|repeat-y|space|round)(?=$|[\s,])/.test(rep);
    }

    function processElement(el, parentEff) {
        const hadFg = el.hasAttribute(A_FG);
        el.removeAttribute(A_BG);
        el.removeAttribute(A_IMG);
        el.removeAttribute(A_HALO);
        if (hadFg) { el.removeAttribute(A_FG); el.style.removeProperty('--illy-fg'); }

        const cs = el.ownerDocument.defaultView.getComputedStyle(el);
        const own = parseColor(cs.backgroundColor);
        const img = cs.backgroundImage;
        const hasImg = !!img && img !== 'none';

        let eff = parentEff;
        let imgGone = !hasImg;

        if (own && own.a >= 0.5 && isLight(own)) {
            el.setAttribute(A_BG, '1');
            eff = PANEL_BG;
            imgGone = true;
        } else {
            if (own && own.a > 0) eff = own.a >= 1 ? own : blend(own, parentEff);
            if (hasImg && shouldKillImage(el, cs, img)) {
                el.setAttribute(A_IMG, '1');
                imgGone = true;
            }
        }

        if (needsFg(el)) {
            const fg = parseColor(cs.color);
            if (fg) {
                const f = fg.a < 1 ? blend(fg, eff) : fg;
                const win = el.ownerDocument.defaultView;
                const parent = el.parentElement;
                const inheritedFix = !!parent && parent.hasAttribute(A_FG) &&
                    win.getComputedStyle(parent).color === cs.color;
                const isControl = el.tagName === 'INPUT' || FORM_TAGS.has(el.tagName);
                const isLink = el.tagName === 'A';

                let out = null;

                if (isLink) {
                    out = LINK_BLUE;
                } else if (FORCE_WHITE_TAGS.has(el.tagName)) {
                    out = WHITE;
                } else if (!inheritedFix && !isControl) {
                    if (contrast(f, eff) < MIN_CONTRAST) out = fixFg(f, eff);
                }

                if (out) {
                    el.style.setProperty('--illy-fg', toHex(out));
                    el.setAttribute(A_FG, '1');
                }
            }
            if (!imgGone && hasOwnText(el) && el.offsetWidth >= 60 && el.offsetHeight >= 16) {
                el.setAttribute(A_HALO, '1');
            }
        }

        effCache.set(el, eff);
        return eff;
    }

    function walk(el, parentEff) {
        if (!el || el.nodeType !== 1) return;
        if (SKIP_TAGS.has(el.tagName) || el.namespaceURI === SVG_NS) return;
        if (el.id === 'illy-dark-toggle') return;
        if (el.matches && el.matches(SKIP_SELECTOR)) return;

        try {
            if (el.matches && el.matches(EXCLUDE_FROM_PROCESSING_SELECTOR)) return;
            if (el.closest && el.closest(EXCLUDE_FROM_PROCESSING_SELECTOR)) return;
            if (el.closest && el.closest('.illy-pill-wrapper')) return;
        } catch (e) { }

        const eff = processElement(el, parentEff);
        for (let c = el.firstElementChild; c; c = c.nextElementSibling) walk(c, eff);
    }

    function neutralizeTopBars(doc) {
        ['topbar', 'header', 'cmdbar'].forEach(id => {
            const root = doc.getElementById(id);
            if (!root) return;
            const win = doc.defaultView;
            root.querySelectorAll('*').forEach(el => {
                const tag = el.tagName;
                if (SKIP_TAGS.has(tag) || FORM_TAGS.has(tag) || tag === 'INPUT') return;
                if (el.namespaceURI === SVG_NS) return;
                if (el.closest('.illy-pill-wrapper')) return;
                const cs = win.getComputedStyle(el);
                const bgImg = cs.backgroundImage;
                if (bgImg && bgImg !== 'none') { el.removeAttribute(A_TOP); return; }
                const mask = cs.webkitMaskImage || cs.maskImage;
                if (mask && mask !== 'none') { el.removeAttribute(A_TOP); return; }
                const c = parseColor(cs.backgroundColor);
                if (c && c.a > 0) el.setAttribute(A_TOP, '1');
            });
        });
    }

    function colorizeResourceRates(doc) {
        const topBar = doc.getElementById('topbar') || doc.body;
        if (!topBar) return;
        const w = doc.createTreeWalker(topBar, NodeFilter.SHOW_TEXT);
        const nodes = [];
        while (w.nextNode()) {
            const p = w.currentNode.parentElement;
            if (p && p.tagName !== 'SCRIPT' && p.tagName !== 'STYLE') nodes.push(w.currentNode);
        }
        nodes.forEach(node => {
            const text = node.nodeValue.trim();
            if (/^[-+]\d[\d,]*$/.test(text)) {
                const parent = node.parentElement;
                if (text.startsWith('-')) {
                    parent.classList.add('res-rate-negative');
                    parent.classList.remove('res-rate-positive');
                } else {
                    parent.classList.add('res-rate-positive');
                    parent.classList.remove('res-rate-negative');
                }
            }
        });
    }

    function colorizePrestigeSpendButtons(doc) {
        doc.querySelectorAll('table').forEach(table => {
            const headers = table.querySelectorAll('th');
            if (!headers.length) return;

            let prestigeIdx = -1;
            let allianceIdx = -1;
            headers.forEach((th, i) => {
                const label = (th.textContent || '')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .toLowerCase();
                const compact = label.replace(/\s+/g, '');
                if (label === 'prestige' || compact === 'prestige') {
                    prestigeIdx = i;
                } else if (label === 'alliance prestige' || compact === 'allianceprestige') {
                    allianceIdx = i;
                }
            });
            if (prestigeIdx === -1 && allianceIdx === -1) return;

            const bodyRows = table.querySelectorAll('tbody tr').length
                ? table.querySelectorAll('tbody tr')
                : Array.from(table.querySelectorAll('tr')).filter(
                    tr => !tr.closest('thead') && tr.querySelector('td')
                  );

            bodyRows.forEach(tr => {
                const cells = tr.children;

                if (prestigeIdx !== -1 && cells[prestigeIdx] && cells[prestigeIdx].tagName === 'TD') {
                    applyPill(cells[prestigeIdx], 'illy-spend-red-pill');
                }
                if (allianceIdx !== -1 && cells[allianceIdx] && cells[allianceIdx].tagName === 'TD') {
                    applyPill(cells[allianceIdx], 'illy-spend-blue-pill');
                }
            });
        });
    }

    function isNumericSpendCell(cell) {
        const text = (cell.textContent || '').replace(/\s+/g, ' ').trim();
        if (!/\d/.test(text)) return false;
        const stripped = text.replace(/[\d,.\s]/g, '');
        return stripped.length === 0;
    }

    function applyPill(cell, cls) {
        if (!cell) return;

        if (!isNumericSpendCell(cell)) {
            const stale = cell.querySelector(':scope > span.illy-pill-wrapper');
            if (stale) {
                while (stale.firstChild) cell.insertBefore(stale.firstChild, stale);
                stale.remove();
            }
            if (cell.hasAttribute(A_STYLED)) restoreInline(cell);
            return;
        }

        forceTransparent(cell);

        cell.querySelectorAll('.illy-spend-red-pill, .illy-spend-blue-pill')
            .forEach(el => el.classList.remove('illy-spend-red-pill', 'illy-spend-blue-pill'));

        let wrapper = cell.querySelector(':scope > span.illy-pill-wrapper');

        if (!wrapper) {
            wrapper = cell.ownerDocument.createElement('span');
            wrapper.className = 'illy-pill-wrapper';
            while (cell.firstChild) wrapper.appendChild(cell.firstChild);
            cell.appendChild(wrapper);
        }

        wrapper.classList.add(cls);
    }

    function colorizeContributeButtons(doc) {
        const all = doc.querySelectorAll('a, button, span, div, td, li, p');
        const hits = [];

        all.forEach(el => {
            if (el.closest && el.closest('.illy-pill-wrapper')) return;
            const txt = (el.textContent || '').replace(/\s+/g, ' ').trim();
            if (/^contribute$/i.test(txt)) hits.push(el);
        });

        const innermost = hits.filter(el =>
            !hits.some(other => other !== el && el.contains(other))
        );

        innermost.forEach(el => {
            const textOf = n => (n.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
            const inputSel = 'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="image"]):not([type="submit"]):not([type="button"])';

            let target = el;
            let p = el.parentElement;
            while (p && p !== doc.body) {
                const tag = p.tagName;
                if (tag === 'TD' || tag === 'TH' || tag === 'TR' ||
                    tag === 'TBODY' || tag === 'THEAD' || tag === 'TABLE') break;
                if (textOf(p) !== 'contribute') break;
                if (p.querySelector(inputSel)) break;
                target = p;
                p = p.parentElement;
            }

            wrapElementAsPill(target, 'illy-spend-red-pill');
            const w = target.querySelector(':scope > .illy-pill-wrapper');
            if (w) w.classList.add('illy-contribute-pill');
            clearContributeBlock(target);
        });
    }

    function wrapElementAsPill(el, cls) {
        if (!el) return;

        if (el.classList && el.classList.contains('illy-pill-wrapper')) {
            el.classList.remove('illy-spend-red-pill', 'illy-spend-blue-pill');
            el.classList.add(cls);
            return;
        }

        let wrapper = el.querySelector(':scope > span.illy-pill-wrapper');
        if (wrapper) {
            wrapper.classList.remove('illy-spend-red-pill', 'illy-spend-blue-pill');
            wrapper.classList.add(cls);
            return;
        }

        wrapper = el.ownerDocument.createElement('span');
        wrapper.className = 'illy-pill-wrapper ' + cls;
        while (el.firstChild) wrapper.appendChild(el.firstChild);
        el.appendChild(wrapper);

        forceTransparent(el);
    }

    function clearContributeBlock(target) {
        const inputSel = 'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="image"]):not([type="submit"]):not([type="button"])';
        const clear = el => { if (el && el.nodeType === 1) el.classList.add('illy-contribute-clear'); };
        const textLen = el => (el.textContent || '').replace(/\s+/g, ' ').trim().length;

        let container = null;
        let p = target.parentElement;
        while (p && p.tagName !== 'BODY') {
            if (p.querySelector(inputSel)) { container = p; break; }
            p = p.parentElement;
        }
        if (!container || textLen(container) > 80) return;

        let q = target.parentElement;
        while (q && q !== container) { clear(q); q = q.parentElement; }
        clear(container);

        container.querySelectorAll('*').forEach(el => {
            if (target.contains(el) || el.matches(inputSel)) return;
            clear(el);
        });

        let up = container.parentElement, n = 0;
        while (up && up.tagName !== 'BODY' && n < 3 && textLen(up) <= 40) {
            clear(up);
            up = up.parentElement;
            n++;
        }
    }

    const states = new Map();
    const OBS_CONFIG = {
        childList: true, subtree: true, characterData: true,
        attributes: true, attributeFilter: ['style', 'class']
    };

    function attachDoc(doc) {
        if (!doc || !doc.documentElement || !doc.body || states.has(doc)) return;
        injectStyle(doc, ACTIVE);

        const st = { doc, queue: new Set(), timer: null, obs: null };

        st.obs = new MutationObserver(records => {
            for (const m of records) {
                if (m.type === 'childList') {
                    m.addedNodes.forEach(n => {
                        if (n.nodeType === 1) st.queue.add(n);
                        else if (n.nodeType === 3 && n.parentElement) st.queue.add(n.parentElement);
                    });
                } else if (m.type === 'attributes') {
                    st.queue.add(m.target);
                } else if (m.type === 'characterData' && m.target.parentElement) {
                    st.queue.add(m.target.parentElement);
                }
            }
            schedule(st);
        });

        states.set(doc, st);

        const seen = new WeakSet();
        const touch = e => {
            const t = e.target;
            if (t && t.nodeType === 1 && !seen.has(t)) {
                seen.add(t);
                st.queue.add(t);
                schedule(st);
            }
        };
        doc.addEventListener('mouseover', touch, true);
        doc.addEventListener('focusin', touch, true);

        processRoots(st, [doc.body]);
    }

    function schedule(st) {
        if (st.timer) return;
        st.timer = setTimeout(() => flush(st), 100);
    }

    function flush(st) {
        st.timer = null;
        let roots = Array.from(st.queue).filter(r => r.isConnected);
        st.queue.clear();
        if (!roots.length) return;
        if (roots.length > 150) roots = [st.doc.body];
        else roots = roots.filter(r => !roots.some(o => o !== r && o.contains(r)));
        processRoots(st, roots);
        if (st.doc === document) checkIframes();
    }

    function processRoots(st, roots) {
        st.obs.disconnect();
        try {
            if (st.doc === document) colorizeResourceRates(document);
            colorizePrestigeSpendButtons(st.doc);
            colorizeContributeButtons(st.doc);
            neutralizeTopBars(st.doc);
            roots.forEach(r => {
                if (!r.isConnected) return;
                if (r.closest && r.closest(SKIP_SELECTOR)) return;
                walk(r, effOf(r.parentElement));
            });
        } catch (err) {
            console.error('Illyriad dark mode error', err);
        } finally {
            st.obs.observe(st.doc.documentElement, OBS_CONFIG);
        }
    }

    function checkIframes() {
        document.querySelectorAll('iframe').forEach(iframe => {
            try {
                const d = iframe.contentDocument;
                if (d && d.body) attachDoc(d);
                if (!iframe.__illyHooked) {
                    iframe.__illyHooked = true;
                    iframe.addEventListener('load', () => {
                        if (isThemed()) setTimeout(checkIframes, 50);
                    });
                }
            } catch (e) { }
        });
    }

    function enableAll() {
        attachDoc(document);
        checkIframes();
    }
    function disableAll() {
        states.forEach(st => {
            st.obs.disconnect();
            clearTimeout(st.timer);
            clearMarkers(st.doc);
            removeStyle(st.doc);
        });
        states.clear();
        removeStyle(document);
        clearMarkers(document);
    }

    /* ============================================================
       MODE MANAGEMENT
       ============================================================ */

    const MODES = ['light', 'graphite'];

    function isThemed() {
        return mode !== 'light';
    }

    let mode = localStorage.getItem(STORE_KEY);
    if (!MODES.includes(mode)) mode = 'graphite';

    function applyMode(newMode) {
        const wasThemed = isThemed();
        mode = newMode;
        localStorage.setItem(STORE_KEY, newMode);

        if (wasThemed) disableAll();

        if (newMode === 'light') {
            // Default site look — nothing to inject
        } else {
            bindConstants(THEMES.graphite);
            injectStyle(document, ACTIVE);
            enableAll();
        }
        updateToggle();
    }

    /* ============================================================
       TOGGLE BUTTON
       ============================================================ */

    function createToggle() {
        if (document.getElementById('illy-dark-toggle')) return;

        const btn = document.createElement('button');
        btn.id = 'illy-dark-toggle';

        Object.assign(btn.style, {
            position: 'fixed',
            bottom: '15px',
            right: '15px',
            zIndex: '999999',
            padding: '8px 12px',
            borderRadius: '20px',
            border: '1px solid #4b5563',
            backgroundColor: '#202228',
            color: '#f3f4f6',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            transition: 'all 0.2s ease'
        });

        btn.addEventListener('mouseenter', () => { btn.style.transform = 'scale(1.05)'; });
        btn.addEventListener('mouseleave', () => { btn.style.transform = 'scale(1)'; });

        btn.addEventListener('click', () => {
            const idx = MODES.indexOf(mode);
            const next = MODES[(idx + 1) % MODES.length];
            applyMode(next);
        });

        document.body.appendChild(btn);
        updateToggle();
    }

    function updateToggle() {
        const btn = document.getElementById('illy-dark-toggle');
        if (!btn) return;
        if (mode === 'light') {
            btn.innerText = 'Default';
        } else {
            const t = THEMES[mode];
            btn.innerText = t ? t.label : mode;
        }
    }

    function onReady() {
        if (isThemed()) {
            bindConstants(THEMES.graphite);
            injectStyle(document, ACTIVE);
            enableAll();
        }
        createToggle();
    }

    if (isThemed()) {
        bindConstants(THEMES.graphite);
        injectStyle(document, ACTIVE);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onReady);
    } else {
        onReady();
    }

    window.addEventListener('load', () => {
        if (!isThemed()) return;
        const st = states.get(document);
        if (st && document.body) {
            st.queue.add(document.body);
            schedule(st);
        }
        checkIframes();
    });

})();