jest.dontMock('../applinks');

var testData = {
  allProperties: [
    ['al:ios:url', 'applinks://docs/ios'],
    ['al:ios:app_store_id', '12345'],
    ['al:ios:app_name', 'App Links iOS'],
    ['al:iphone:url', 'applinks://docs/iphone'],
    ['al:iphone:app_store_id', '23456'],
    ['al:iphone:app_name', 'App Links iPhone'],
    ['al:ipad:url', 'applinks://docs/ipad'],
    ['al:ipad:app_store_id', '34567'],
    ['al:ipad:app_name', 'App Links iPad'],
    ['al:android:url', 'applinks://docs/android'],
    ['al:android:package', 'org.applinks'],
    ['al:android:class', 'org.applinks.DocsActivity'],
    ['al:android:app_name', 'App Links Android'],
    ['al:windows_phone:url', 'applinks://docs/windows_phone'],
    ['al:windows_phone:app_id', 'a14e93aa-27c7-df11-a844-00237de2db9f'],
    ['al:windows_phone:app_name', 'App Links Windows Phone'],
    ['al:web:url', 'http://applinks.org/documentation'],
    ['al:web:should_fallback', 'true']
  ],

  allPropertiesParsed: {
    ios: {
      'url': 'applinks://docs/ios',
      'app_store_id': '12345',
      'app_name': 'App Links iOS'
    },

    iphone: {
      'url': 'applinks://docs/iphone',
      'app_store_id': '23456',
      'app_name': 'App Links iPhone',
    },

    ipad: {
      'url': 'applinks://docs/ipad',
      'app_store_id': '34567',
      'app_name': 'App Links iPad',
    },

    android: {
      'url': 'applinks://docs/android',
      'package': 'org.applinks',
      'class': 'org.applinks.DocsActivity',
      'app_name': 'App Links Android',
    },

    windows_phone: {
      'url': 'applinks://docs/windows_phone',
      'app_id': 'a14e93aa-27c7-df11-a844-00237de2db9f',
      'app_name': 'App Links Windows Phone',
    },

    web: {
      'url': 'http://applinks.org/documentation',
      'should_fallback': 'true',
    }
  },

  allAppLinks: {
    'iphone': 'applinks://docs/iphone',
    'ipad': 'applinks://docs/ipad',
    'android': 'applinks://docs/android',
    'windows_phone': 'applinks://docs/windows_phone',
    'web': 'http://applinks.org/documentation'
  },

  allStoreLinks: {
    'iphone': 'itms://itunes.apple.com/app/appName/id23456?mt=8',
    'ipad': 'itms://itunes.apple.com/app/appName/id34567?mt=8',
    'android': 'market://details?id=org.applinks',
    'windows_phone': 'http://windowsphone.com/s?appId=a14e93aa-27c7-df11-a844-00237de2db9f'
  },

  userAgents: {
    'iphone': 'Mozilla/5.0 (iPhone; CPU iPhone OS 7_1_2 like Mac OS X) AppleWebKit/537.51.2 (KHTML, like Gecko) Version/7.0 Mobile/11D257 Safari/9537.53',
    'ipad': 'Mozilla/5.0 (iPad; CPU OS 7_1_2 like Mac OS X) AppleWebKit/537.51.2 (KHTML, like Gecko) Version/7.0 Mobile/11D257 Safari/9537.53',
    'android': 'Mozilla/5.0 (Linux; Android 4.0.4; Galaxy Nexus Build/IMM76B) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.133 Mobile Safari/535.19',
    'windows_phone': 'Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; IEMobile/10.0; ARM; Touch; NOKIA; Lumia 920)',
    'web': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.1916.153 Safari/537.36'
  }
};

describe('applinks.js', function() {
  var AppLinks = require('../applinks');
  function addMetaTags(data) {
    var head = '';

    data.forEach(function(d) {
      var property = d[0], content = d[1];

      head += '<meta property="' + property + '" content="' + content + '" />';
    });

    document.head.innerHTML += head;
  }

  function clearMetaTags() {
    document.head.innerHTML = '';
  }

  var applinks;

  beforeEach(function() {
    clearMetaTags();
    applinks = undefined;
  });

  describe('basic basics', function() {
    it('should exist', function() {
      expect(AppLinks).toBeDefined();
    });
  });

  describe('meta tags parsing function', function() {
    it('should support all properties defined in the applinks specs', function() {
      addMetaTags(testData.allProperties);
      applinks = new AppLinks();
      expect(applinks.applinks).toEqual(testData.allPropertiesParsed);
    });

    it('should not include the properties defined for other specs', function() {
      addMetaTags([['og:description', 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.']]);
      addMetaTags([['al:ios:url', 'applinks://docs']]);
      applinks = new AppLinks();
      expect(applinks.applinks).toEqual({ios: {url: 'applinks://docs'}});
    });
  });

  describe('device detection', function() {
    it('should detect the basic devices', function() {
      var userAgents = testData.userAgents, device;

      for (device in userAgents) {
        if (userAgents.hasOwnProperty(device)) {
          applinks = new AppLinks({
            userAgent: userAgents[device]
          });

          expect(applinks.getDeviceType()).toEqual(device);
        }
      }
    });
  });

  describe('deep linking url detection', function() {
    it('should find the right links to the app when provided', function() {
      var device, link, userAgent;

      addMetaTags(testData.allProperties);

      for (device in testData.allAppLinks) {
        if (testData.allAppLinks.hasOwnProperty(device)) {
          link = testData.allAppLinks[device];
          userAgent = testData.userAgents[device];

          applinks = new AppLinks({
            userAgent: userAgent
          });

          expect(applinks.getAppUrl()).toEqual(link);
        }
      }
    });

    it('should not find a link when the meta tag isn\'t included', function() {
      applinks = new AppLinks({
        userAgent: testData.userAgents.iphone
      });

      expect(applinks.getAppUrl()).toBeNull();
    });
  });

  describe('store url detection', function() {
    it('should find the right links to the store', function() {
      var device, link, userAgent;

      addMetaTags(testData.allProperties);

      for (device in testData.allStoreLinks) {
        if (testData.allAppLinks.hasOwnProperty(device)) {
          link = testData.allStoreLinks[device];
          userAgent = testData.userAgents[device];

          applinks = new AppLinks({
            userAgent: userAgent
          });

          expect(applinks.getStoreUrl()).toEqual(link);
        }
      }
    });

    it('should not find a link to the store when the meta tag isn\'t included', function() {
      applinks = new AppLinks({
        userAgent: testData.userAgents.iphone
      });

      expect(applinks.getStoreUrl()).toBeNull();
    });
  });

  describe('redirect', function() {
    it('should redirect user to the app url', function() {
      addMetaTags(testData.allProperties);

      applinks = new AppLinks({
        userAgent: testData.userAgents.iphone
      });

      spyOn(applinks, 'goToUrl');

      applinks.autoLink();

      expect(applinks.goToUrl).toHaveBeenCalledWith(testData.allPropertiesParsed.iphone.url);
    });

    it('should redirect user to the store url when the app is not available', function() {
      // assuming that the app isn't installed
      addMetaTags(testData.allProperties);

      applinks = new AppLinks({
        userAgent: testData.userAgents.iphone
      });

      spyOn(applinks, 'goToUrl');

      applinks.autoLink();

      setTimeout(function() {
        expect(applinks.goToUrl.mostRecentCall.args[0]).toEqual(applinks.getStoreUrl());
      }, 50);

      jasmine.Clock.useMock();
      jasmine.Clock.tick(60);
    });

    it('should not redirect user to the store url when the option is set to `false`', function() {
      // assuming that the app isn't installed
      addMetaTags(testData.allProperties);

      applinks = new AppLinks({
        userAgent: testData.userAgents.iphone,
        redirectToStore: false
      });

      spyOn(applinks, 'goToUrl');

      applinks.autoLink();

      setTimeout(function() {
        expect(applinks.goToUrl).not.toHaveBeenCalledWith(applinks.getStoreUrl());
      }, 50);

      jasmine.Clock.useMock();
      jasmine.Clock.tick(60);
    });

    it('should redirect user to a web url when the option is given', function() {
      addMetaTags(testData.allProperties);

      applinks = new AppLinks({
        userAgent: testData.userAgents.iphone,
        redirectToStore: false
      });

      spyOn(applinks, 'goToUrl');

      applinks.autoLink();

      setTimeout(function() {
        expect(applinks.goToUrl).toHaveBeenCalledWith(testData.allPropertiesParsed.web.url);
      }, 50);

      jasmine.Clock.useMock();
      jasmine.Clock.tick(60);
    });
  });
});
