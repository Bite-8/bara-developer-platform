# Backstage のローカルインストール手順

この手順では、`@backstage/create-app` を使って Backstage アプリをローカルに作成し、起動してブラウザで確認するところまでを説明します。

Backstage は、作成したアプリを土台にして、プラグイン、Backend Module、設定ファイル、Software Catalog、Software Templates、TechDocs などで拡張していく構成です。公式ドキュメントでも、プラグインアーキテクチャによって既存プラグインを追加したり、必要に応じて独自プラグインを作成したりして、組織の開発者ポータルとしてカスタマイズする考え方が示されています。

ここで作成するアプリは、完成済みの単独製品ではなく、今後プラグインや設定を追加して育てていくための初期プロジェクトです。

## 前提条件

ローカル環境に以下を用意します。

- Unix 系の環境
  - Linux
  - macOS
  - Windows の場合は WSL
- Node.js
  - Active LTS Release を使用する
  - `nvm` を使う場合は `nvm install --lts` で最新の LTS を入れる
  - Backstage 公式ドキュメントでは、Node.js 22 または 24 が推奨例として挙げられている
- `git`
- `curl` または `wget`
- ビルドツール
  - Ubuntu/Debian: `make` と `build-essential`
  - macOS: `xcode-select --install`
- Docker
- Corepack / Yarn

Node.js と Corepack の確認例です。

```bash
node --version
corepack --version
```

Corepack を有効化します。

```bash
corepack enable
```

Backstage は Yarn 4.4.1 を使用します。Yarn をバージョン未指定でグローバルインストールするのではなく、Corepack 経由で Backstage が要求する Yarn バージョンを使います。

```bash
yarn set version 4.4.1
yarn --version
```

## Backstage アプリを作成する

作業用ディレクトリに移動して、Backstage アプリの初期プロジェクトを作成します。

```bash
mkdir -p ~/workspace
cd ~/workspace
npx @backstage/create-app@latest
```

実行するとアプリ名を聞かれます。例として `my-backstage-app` を入力します。

```text
Enter a name for the app [required]: my-backstage-app
```

コマンドが完了すると、指定した名前のディレクトリが作成されます。

```bash
cd my-backstage-app
```

作成されたプロジェクトは Yarn workspaces を使った monorepo 構成です。主なディレクトリは以下です。

- `packages/app`: Backstage のフロントエンドアプリ
- `packages/backend`: Backstage のバックエンド
- `app-config.yaml`: アプリ全体の設定

これは生成直後の Backstage アプリの一般的な構成です。Bara では、app shell や代表 journey は `packages/app`、Bara 固有の API や domain service は `packages/backend`、独立して再利用・配布・合成する機能は plugin / module に置きます。配置は product goal と責務境界で選びます。

## 起動する

アプリのルートディレクトリで以下を実行します。

```bash
yarn start
```

`yarn start` は、フロントエンドとバックエンドを同じターミナル内で起動します。ここで実行される `yarn` は、Corepack とプロジェクト側の設定に従って解決されます。

- フロントエンド: `http://localhost:3000`
- バックエンド: `http://localhost:7007`

初回起動は依存関係のビルドがあるため、時間がかかる場合があります。

## ブラウザで確認する

ブラウザが自動で開かない場合は、以下にアクセスします。

```text
http://localhost:3000
```

Backstage の画面が表示されれば起動確認は完了です。

確認ポイント:

- サイドバーやトップページが表示される
- Catalog などのメニューを開ける
- ターミナルに致命的なエラーが出ていない

## 停止する

起動中のターミナルで `Ctrl + C` を押します。

## よくあるエラー

### ポートが使用中

`3000` または `7007` が使用中の場合は、既存プロセスを停止してから再実行します。

```bash
yarn start
```

### isolated-vm のインストールに失敗する

`isolated-vm` のビルドに失敗する場合は、OS のビルドツールや Python などのネイティブビルド要件が不足している可能性があります。

Ubuntu/Debian の例:

```bash
sudo apt update
sudo apt install -y build-essential make python3
```

その後、Backstage アプリのルートディレクトリで依存関係を再インストールします。

```bash
yarn install
```

### Docker が起動していない

Docker が必要な機能を使う場合は、Docker Desktop または Docker daemon が起動していることを確認します。

```bash
docker --version
docker ps
```

## 参考

- [Backstage Standalone Installation](https://backstage.io/docs/next/getting-started/)
- [Backstage Local development](https://backstage.io/docs/golden-path/create-app/local-development)
- [Backstage Technical overview](https://backstage.io/docs/overview/technical-overview/)
- [Configuring App with plugins](https://backstage.io/docs/getting-started/configure-app-with-plugins/)
- [Installing Plugins](https://backstage.io/docs/frontend-system/building-apps/installing-plugins/)
