const getCookies = require("./getCookies")

getCookies("https://bean.m.jd.com").then(result => {
  const cookieString = result.filter((n) => n.domain.includes("jd.com"))
  .map((n) => n.name + "=" + n.value)
  .join("; ");
  $ui.alert({
    title: "已获取Cookie",
    actions: [
      {
        title: "取消",
        style: $alertActionType.destructive
      },
      {
        title: "复制",
        handler: function() {
          $clipboard.text = cookieString
        }
      }
    ]
  });
});