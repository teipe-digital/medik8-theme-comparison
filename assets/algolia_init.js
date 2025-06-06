(function(algolia) {
  'use strict';

  if (algolia.config.powered_by) {
    // eslint-disable-next-line no-console
  }

  /* Store variables */
  algolia.storeName = window.location.hostname
    .replace(/^www\./, '')
    .replace(/^([^.]*)\..*$/, '$1');

  algolia.templates = {};
  algolia.indices = {};

  /**
   * Checks whether we are on the `/search` page
   */
  algolia.full_results = Boolean(window.location.href.match(/\/search/));

  /**
   * Checks whether we are on a collection page
   */
  algolia.is_collection_results_page = Boolean(
    // We want to match `/collections/handle` but only if handle != 'all'
    window.location.pathname.match(/^\/collections\/(?!all$)([^/]+)[/]*$/)
    /**
     * To match /collections/handle/handle-two links as well, please use
     * the following regex instead:
     */
    // window.location.pathname.match(/^\/collections\/(?!all)(.*)$/)
  );

  /* Hide page content during InstantSearch loading */
  var collectionPageEnabled =
    algolia.is_collection_results_page &&
    algolia.config.instant_search_enabled_on_collection;
  var results_selector = collectionPageEnabled
    ? algolia.config.collection_css_selector
    : algolia.config.results_selector;
  results_selector += ', .algolia-shopify-instantsearch';

  if (
    (algolia.full_results && algolia.config.instant_search_enabled) ||
    collectionPageEnabled
  ) {
    algolia.contentHide = new DOMParser().parseFromString(
      '<style>' + results_selector + ' { visibility: hidden }</style>',
      'text/html'
    ).head.firstElementChild;
    document.head.append(algolia.contentHide);
  }

  /* We use Hogan as our templating engine with a custom delimiter: [[ ... ]] */
  algolia.hoganOptions = { delimiters: '[[ ]]' };
  algolia.getTemplate = function getTemplate(name) {
    var el = document.getElementById('template_algolia_' + name);
    return el ? el.innerHTML : '';
  };
  algolia.compileTemplate = function compileHoganTemplate(name) {
    return algolia.externals.Hogan.compile(
      algolia.getTemplate(name),
      algolia.hoganOptions
    );
  };
  algolia.render = function render(template, obj) {
    var newObj = algolia.assign({}, obj, { helpers: algolia.hoganHelpers });
    return template.render(newObj);
  };

  // Current collection page ID
  var current_collection_id_string = algolia
    .getTemplate('current_collection_id')
    .replace(/^\s+|\s+$/g, '');

  if (current_collection_id_string) {
    try {
      var current_collection_id_object = JSON.parse(
        current_collection_id_string
      );
      algolia.current_collection_id =
        current_collection_id_object.currentCollectionID;
    } catch (error) {
      // Encountered an error while trying to parse the collection ID.
      // This most probably means that we aren't on a collection page.
    }
  }

  /* Add CSS block after current script */
  algolia.appendStyle = function appendStyle(content) {
    var scripts = document.getElementsByTagName('script');
    var currentScript = scripts[scripts.length - 1];
    var style = document.createElement('style');
    style.innerHTML = content;
    currentScript.parentNode.insertBefore(style, currentScript.nextSibling);
  };

  algolia.assign = function assign(to) {
    for (var i = 1; i < arguments.length; i++) {
      var nextSource = arguments[i];
      for (var nextKey in nextSource) {
        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
          to[nextKey] = nextSource[nextKey]; // eslint-disable-line no-param-reassign
        }
      }
    }
    return to;
  };

  // 
  algolia.money_format = algolia
    .getTemplate('money_format')
    .replace(/^\s+|\s+$/g, '');
  algolia.formatMoney = function formatMoney(cents) {
    var priceInCents = cents;

    /**
     * Uncomment the following block to support Shopify multi currency
     * and convert prices from store currency to the currency selected by
     * the user (aka "presentment" currency).
     * Please note that this relies on the `Shopify.currency` object exposed
     * by Shopify which is an undocumented feature and can change at any time.
     */
    // if (
    //   typeof Shopify !== 'undefined' &&
    //   typeof Shopify.currency !== 'undefined' &&
    //   typeof Shopify.currency.rate !== 'undefined' &&
    //   typeof Shopify.currency.active !== 'undefined'
    // ) {
    //   // Convert to "presentment" currency using the rate provided by Shopify
    //   priceInCents = priceInCents * Shopify.currency.rate;
    //   // Round up to the nearest whole number keeping in accordance with
    //   // the default rounding strategy of Shopify
    //   priceInCents = Math.ceil(priceInCents);
    //
    //   /**
    //    * Shopify uses different rounding strategies for different currencies.
    //    * The logic below might need to be customised based on the active currencies.
    //    * Note: Please only include currencies other than your store currency.
    //    */
    //   // Round up to the 95th cent for EUR
    //   if (Shopify.currency.active === 'EUR') {
    //     priceInCents = parseInt(priceInCents / 100, 10) * 100 + 95;
    //   }
    //   // Round up to the 00th cent for GBP, USD, DKK
    //   else if (
    //     Shopify.currency.active === 'GBP' ||
    //     Shopify.currency.active === 'USD' ||
    //     Shopify.currency.active === 'DKK'
    //   ) {
    //     priceInCents = parseInt(priceInCents / 100, 10) * 100 + 100;
    //   }
    // }

    var val = (priceInCents / 100.0).toLocaleString('en', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    var format = algolia.money_format;

    // Not necessary, but allows for more risk tolerance if Shopify.formatMoney doesn't work as we want
    var regexp = /^([^{}]*)\{\{amount\}\}([^{}]*)$/;
    if (format.match(regexp)) {
      return format.replace(regexp, '$1' + val + '$2');
    }

    regexp = /^([^{}]*)\{\{amount_with_comma_separator\}\}([^{}]*)$/;
    if (format.match(regexp)) {
      var money = val.replace(/[.]/, '|');
      money = money.replace(/[,]/, '.');
      money = money.replace(/[|]/, ',');
      return format.replace(regexp, '$1' + money + '$2');
    }

    if (window.Shopify && window.Shopify.formatMoney) {
      return window.Shopify.formatMoney(priceInCents, format);
    }

    return '$' + val;
  };
})(window.algoliaShopify);
