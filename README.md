# 遊戲小花園

19 款適合孩子與年輕玩家的網頁遊戲，支援電腦鍵盤與手機觸控。

使用純 HTML、CSS、JavaScript，不需要後端、安裝套件或建置。開啟 `index.html` 即可進入遊戲首頁；錄音功能需使用 HTTPS 或 localhost。

## 目錄

- `index.html`：遊戲首頁，提供分類與搜尋。
- `games/`：所有遊戲，每款遊戲各有自己的資料夾。
- `games/shared/`：首頁與遊戲共用的樣式、音效及介面。

遊戲網址為 `/games/<遊戲名稱>/`，例如 `/games/find_mom_3d_v2/`。進度與設定保存在目前的瀏覽器，不會跨裝置自動同步。

## 部署

可使用靜態網站主機。Cloudflare **Pages** 的設定如下：

- 正式分支：`main`
- Framework preset：`None`
- Root directory：專案根目錄
- Build command：留空
- Build output directory：`.`

上述設定適用 Pages；既有 Workers 專案不會自動轉換為 Pages。
