package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
)

func main() {
	// 静的ファイルのディレクトリを設定
	fs := http.FileServer(http.Dir("."))
	http.Handle("/", http.StripPrefix("/", fs))

	// サーバーの起動ポートを設定
	port := "8080"
	if envPort := os.Getenv("PORT"); envPort != "" {
		port = envPort
	}

	log.Printf("サーバーを起動します: http://localhost:%s", port)

	// 現在の作業ディレクトリを取得して表示
	pwd, err := os.Getwd()
	if err == nil {
		log.Printf("静的ファイルディレクトリ: %s", pwd)
		// index.htmlの存在確認
		if _, err := os.Stat(filepath.Join(pwd, "index.html")); err == nil {
			log.Printf("index.html が見つかりました")
		} else {
			log.Printf("警告: index.html が見つかりません: %v", err)
		}
	}

	// サーバーを起動
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatalf("サーバーの起動に失敗しました: %v", err)
	}
}
