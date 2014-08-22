(function() {
  var AppLinks = function(options) {
    this.extendOptions(options);
    this.currentUrl = window.location;

    this.parse();
  };

  AppLinks.prototype = {
    options: {
      redirectToStore: true,
      userAgent: navigator.userAgent,
      setPlayStoreReferrer: false
    },

    deviceRE: /(ios|iphone|ipad|android|windows phone)/i,

    extendOptions: function(options) {
      this.options = this.extend({}, this.options, options);
    },

    extend: function() {
      var result = arguments[0],
        a, key, obj;

      for (a = 1; a < arguments.length; a++) {
        obj = arguments[a];
        if (typeof obj === 'object') {
          for (key in obj) {
            if (obj.hasOwnProperty(key)) {
              result[key] = obj[key];
            }
          }
        }
      }

      return result;
    },

    parseOne: function(results, property, content) {
      if (property && content) {
        var propertyTokens = property.split(':'),
        t, token, currentLevel = results;

        for (t = 0; t < propertyTokens.length; t++) {
          token = propertyTokens[t];

          if (t === propertyTokens.length - 1) {
            if (currentLevel[token]) {
              if (typeof currentLevel[token] === 'string') {
                currentLevel[token] = [currentLevel[token], content];
              } else if (currentLevel[token].push) {
                currentLevel[token].push(content);
              }
            } else {
              currentLevel[token] = content;
            }
          } else {
            currentLevel[token] = currentLevel[token] || {};
          }

          currentLevel = currentLevel[token];
        }
      }
    },

    parse: function() {
      var metaTags = document.getElementsByTagName('meta'),
      results = {},
      t, metaTag;

      for (t = 0; t < metaTags.length; t++) {
        metaTag = metaTags[t];
        this.parseOne(results,
                      metaTag.getAttribute('property'),
                      metaTag.getAttribute('content'));
      }

      this.applinks = results.al || {};
    },

    removeUrlProtocol: function(url) {
      return url.replace(/^[a-zA-Z0-9+-.]+:\/\//, '');
    },

    getDeviceType: function() {
      if (!this._deviceType) {
        var match = this.options.userAgent.match(this.deviceRE);

        if (!match || !match.length) {
          this._deviceType = 'web';
        } else {
          this._deviceType = match[0].replace(/ /g, '_').toLowerCase();
        }
      }

      return this._deviceType;
    },

    getDeviceApplinks: function() {
      if (!this._deviceApplinks) {
        var deviceType = this.getDeviceType(),
        deviceApplinks = this.applinks[deviceType];

        // iOS
        if (!deviceApplinks && (deviceType === 'iphone' || deviceType === 'ipad')) {
          deviceApplinks = this.applinks.ios;
        }

        this._deviceApplinks = deviceApplinks || null;
      }

      return this._deviceApplinks;
    },

    storeUrlConstructors: {
      ios: 'getITunesStoreUrl',
      iphone: 'getITunesStoreUrl',
      ipad: 'getITunesStoreUrl',
      android: 'getPlayStoreUrl',
      windows_phone: 'getWindowsPhoneStoreUrl'
    },

    propertyMapping: {
      ios: {
        appId: 'app_store_id',
        appName: 'appName'
      },
      iphone: {
        appId: 'app_store_id',
        appName: 'appName'
      },
      ipad: {
        appId: 'app_store_id',
        appName: 'appName'
      },
      android: {
        appId: 'package'
      },
      windows_phone: {
        appId: 'app_id'
      }
    },

    getStoreUrlConstructor: function() {
      var deviceType = this.getDeviceType(),
          urlConstructor = this[this.storeUrlConstructors[deviceType]];

      // iOS
      if (!urlConstructor && (deviceType === 'ipad' || deviceType === 'iphone')) {
        urlConstructor = this[this.storeUrlConstructors.ios];
      }

      return urlConstructor || null;
    },

    getStoreUrl: function() {
      var deviceType = this.getDeviceType(),
          deviceApplinks = this.getDeviceApplinks() || {},
          propertyMapping = this.propertyMapping[deviceType] || {},
          appId = deviceApplinks[propertyMapping.appId || 'appId'],
          appName = deviceApplinks[propertyMapping.appName || 'appName'],
          urlConstructor = this.getStoreUrlConstructor();

      if (urlConstructor) {
        return urlConstructor.call(this, appId, appName);
      } else {
        return null;
      }
    },

    getITunesStoreUrl: function(appId, appName) {
      if (!appId) {
        return null;
      } else {
        appName = appName || 'appName';
        return 'itms://itunes.apple.com/app/' + appName + '/id' + appId + '?mt=8';
      }
    },

    getPlayStoreUrl: function(packageName) {
      var url, link;

      if (packageName) {
        url = 'market://details?id=' + packageName;

        if (this.applinks.android && this.applinks.android.url) {
          link = this.applinks.android.url;
        }

        if (link && this.options.setPlayStoreReferrer) {
          url += '&referrer=' + this.removeUrlProtocol(link);
        }

        return url;
      }

      return null;
    },

    getWindowsPhoneStoreUrl: function(appId) {
      return appId ? ('http://windowsphone.com/s?appId=' + appId) : null;
    },

    getWebUrl: function() {
      if (this.applinks.web && this.applinks.web.should_fallback !== 'false') {
        return this.applinks.web.url || null;
      }
    },

    getFallbackUrl: function() {
      var storeUrl = this.getStoreUrl();

      if (storeUrl && this.options.redirectToStore) {
        return storeUrl;
      } else {
        return this.getWebUrl() || this.currentUrl;
      }
    },

    getAppUrl: function() {
      var deviceApplinks = this.getDeviceApplinks(),
          url;

      if (!deviceApplinks || !deviceApplinks.url) {
        return null;
      } else {
        url = deviceApplinks.url;

        return (typeof url === 'string' ?  url : url[0]);
      }
    },

    goToUrl: function(url) {
        window.location = url;
    },

    redirect: function(url, fallbackUrl) {
      if (url) {
        if (fallbackUrl) {
          setTimeout(function() {
            window.location = fallbackUrl;
          }, 25);
        }

        this.goToUrl(url);
      }
    },

    autoLink: function() {
      this.redirect(this.getAppUrl(), this.getFallbackUrl());
    }
  };

  // export
  if (typeof define === 'function') {
    // AMD
    define('applinks', [], function() {return AppLinks;});
  } else if (typeof module !== 'undefined' && module.exports) {
    // Node.js
    module.exports = AppLinks;
  } else {
    // Browser
    window.AppLinks = AppLinks;
  }
} ());
