package main

import (
	"log"
	"net/http"
)

func main() {
	// publicディレクトリ内のファイルをサーブするハンドラを作成
	fs := http.FileServer(http.Dir("public"))

	// ルートパスにハンドラを登録
	http.Handle("/", fs)

	// サーバーを起動し、ポート8080でリクエストを待機
	log.Fatal(http.ListenAndServe(":8080", nil))
}