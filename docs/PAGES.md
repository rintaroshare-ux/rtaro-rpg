# GitHub Pages公開・統合手順

この2.1更新は `rintaroshare-ux/rtaro-rpg` の `main` コミット `ab00fbeab2a8f83b6f2734c069928b328ccdeb5f` を土台にしています。戦闘計算と保存形式を維持し、右側の仲間表示・オリジナルBGM・基本タッチ操作を追加しました。詳細は[変更仕様](BATTLE_MUSIC_TOUCH.md)を参照してください。

## ZIPで適用

統合ソースZIPを既存リポジトリのルートに展開してください。`src/`、`public/`、`package.json`、`package-lock.json`、`.github/`などがルート直下になる配置です。既存の他ファイルは削除せず、差分を確認してください。ZIPに`.git/`・依存・ビルド結果・認証情報は含みません。

```sh
npm ci
npm test
npm run build
git add src public scripts docs tests .github package.json package-lock.json README.md .gitignore
git commit -m "Add party battle formation, original music and touch controls"
git push origin main
```

Windowsの展開ソフトによっては`.github`などの隠しファイルが表示されないことがあるため、`.github/workflows/deploy.yml`も含めて配置してください。

## パッチで適用

同梱の`.patch`はPNGを含むGit形式の変更です。既存の変更をコミットして作業領域をきれいにしてから、最新版を取得して適用します。

```sh
git switch main
git pull --ff-only origin main
git am /path/to/rtaro-v2.1.patch
npm ci
npm test
npm run build
git push origin main
```

基点以降に変更があって競合した場合は、内容を確認して統合してください。中止する場合は`git am --abort`で適用前に戻せます。強制pushは不要です。

## GitHub側の設定

1. Settings → Pages → Build and deployment → Source を **GitHub Actions** にする。
2. `main`にpushするか、Actions → Build and Deploy RPG → Run workflow。
3. BuildとDeployが成功したら、 https://rintaroshare-ux.github.io/rtaro-rpg/ を開く。

既存ワークフローを更新し、Node 22 + `npm ci`、テスト、ビルド、`dist/`配信を設定しています。PRではテストとビルドのみ実行し、公開はmainのみです。

`base: './'`と`import.meta.env.BASE_URL`によりサブディレクトリのJS・CSS・PNGを相対参照します。キャラクターPNG4枚とタイルセットを必ず`public/assets/`に含めてください。配信用ZIPにはビルド結果だけを含み、Pythonやnpmを実行するサーバーは不要です。

## 認証

GitHub連携では、対象リポジトリへの書き込み権限を許可してください。ChatGPTの連携とPCのGitHub CLIは別の認証です。認証情報はコード・ZIPに含めないでください。PCでCLIを使う場合は必要に応じて次を実行します。

```sh
gh auth login --hostname github.com --web
gh auth setup-git
git push origin main
```

## 配信前のローカル確認

```sh
npm test
npm run build
npm run test:pages
```

`test:pages`はビルド済みの`dist/`を一時HTTPサーバーで`/rtaro-rpg/`配下に配信し、JS・CSS・PNG5枚の読み込み、タイトルとフィールド起動をChromiumで確認します。Chromiumがない環境では`npx playwright install chromium`を実行するか、`CHROMIUM_PATH`を指定してください。
