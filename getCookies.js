const { Web: WebView, ContentView } = require("cview-singleviews");
const Sheet = require("cview-dialog-sheet");
const SymbolButton = require("cview-symbol-button");

function getAllCookies(webView) {
  return new Promise((resolve, reject) => {
    const httpCookieStore = webView
      .ocValue()
      .invoke("configuration")
      .invoke("websiteDataStore")
      .invoke("httpCookieStore");
    const handler = $block("void, NSArray *", function (array) {
      const list = [];
      const length = array.$count();
      for (let index = 0; index < length; index++) {
        const element = array.$objectAtIndex_(index);
        list.push(element);
      }
      resolve(
        list.map(n => {
          return {
            domain: n.$domain().jsValue(),
            path: n.$path().jsValue(),
            version: n.$version(),
            sessionOnly: n.$sessionOnly(),
            name: n.$name().jsValue(),
            value: n.$value().jsValue(),
            HTTPOnly: n.$HTTPOnly(),
            secure: n.$secure()
          };
        })
      );
    });
    httpCookieStore.$getAllCookies_(handler);
  });
}

function presentSheet(url) {
  let flagLoading = false;
  const loadButton = new SymbolButton({
    props: {
      symbol: "arrow.counterclockwise"
    },
    events: {
      tapped: sender => {
        if (flagLoading) webView.view.stopLoading();
        else webView.view.reload();
      }
    }
  });
  const startLoading = () => {
    flagLoading = true;
    loadButton.symbol = "xmark";
  };
  const stopLoading = () => {
    flagLoading = false;
    loadButton.symbol = "arrow.counterclockwise";
  };
  const footerbar = new ContentView({
    props: {
      bgcolor: $color("tertiarySurface")
    },
    layout: (make, view) => {
      make.left.right.bottom.inset(0);
      make.top.equalTo(view.super.safeAreaBottom).inset(-50);
    },
    views: [
      {
        type: "stack",
        props: {
          axis: $stackViewAxis.horizontal,
          distribution: $stackViewDistribution.equalSpacing,
          stack: {
            views: [
              new SymbolButton({
                props: {
                  symbol: "chevron.left"
                },
                events: {
                  tapped: sender => webView.view.goBack()
                }
              }).definition,
              new SymbolButton({
                props: {
                  symbol: "chevron.right"
                },
                events: {
                  tapped: sender => webView.view.goForward()
                }
              }).definition,
              loadButton.definition,
              new SymbolButton({
                props: {
                  symbol: "square.and.arrow.up"
                },
                events: {
                  tapped: sender => $share.sheet(webView.view.url)
                }
              }).definition
            ]
          }
        },
        layout: $layout.fillSafeArea
      }
    ]
  });
  const webView = new WebView({
    props: {
      url
    },
    layout: (make, view) => {
      make.bottom.equalTo(footerbar.view.top);
      make.top.left.right.equalTo(view.super.safeArea);
    },
    events: {
      decideNavigation: (sender, action) => {
        if (action.type === 0) {
          sender.url = action.requestURL;
          return false;
        }
        return true;
      },
      didStart: (sender, navigation) => startLoading(),
      didFinish: (sender, navigation) => stopLoading(),
      didFail: (sender, navigation, error) => stopLoading()
    }
  });

  const view = new ContentView({
    props: {
      bgcolor: $color("secondarySurface")
    },
    views: [footerbar.definition, webView.definition]
  });
  view.result = () => {
    return getAllCookies(webView.view);
  };
  const sheet = new Sheet({
    props: {
      presentMode: 1,
      title: "登录",
      cview: view
    }
  });
  return new Promise((resolve, reject) => {
    sheet.promisify(resolve, reject);
    sheet.present();
  });
}

async function getCookies(url) {
  const cookies = await presentSheet(url);
  return cookies;
}

module.exports = getCookies;
