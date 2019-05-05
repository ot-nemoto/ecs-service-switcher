# ecs-service-switcher

### 概要

- 指定された時間に、特定のタグが付与されたECSクラスタのFargateタスクを起動・停止する。
- 起動する時間は平日（月～金）の午前８時。
- 停止する時間は平日（月～金）の午後９時。
- デフォルトのリージョンは東京（ap-northeast-1）。

### 使い方

- 起動・停止対象のECSクラスターに `ecs-service-switcher-isenabled` タグを付与。
- タグの値には `ON`, `TRUE`, `1` の何れかを設定。
- 起動・停止対象から外したい場合はタグを削除。またはタグの値に上記以外を設定。
- 起動時デフォルトではタスク数は `1` 。
- `default-desired-count` タグを指定した場合は、その値をタスク数に設定。

### デプロイ

*serverless*
```sh
(cd layer/nodejs; npm install)
(cd layer/nodejs; npm install)
sls deploy --public_holiday_api ${uri}/holiday
```

※ ${uri} は [public-holiday-api](https://github.com/ot-nemoto/public-holiday-api) でdeployした祝日APIを参照
