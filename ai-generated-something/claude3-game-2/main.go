package main

import (
	"fmt"
	"image/color"
	"log"
	"math/rand"

	"github.com/hajimehoshi/ebiten/v2"
	"github.com/hajimehoshi/ebiten/v2/ebitenutil"
)

const (
	screenWidth  = 640
	screenHeight = 480
)

type Game struct {
	playerX, playerY float64
	enemies          []Enemy
	score            int
}

type Enemy struct {
	x, y float64
}

func (g *Game) Update() error {
	if ebiten.IsKeyPressed(ebiten.KeyUp) {
		g.playerY -= 5
	}
	if ebiten.IsKeyPressed(ebiten.KeyDown) {
		g.playerY += 5
	}
	if ebiten.IsKeyPressed(ebiten.KeyLeft) {
		g.playerX -= 5
	}
	if ebiten.IsKeyPressed(ebiten.KeyRight) {
		g.playerX += 5
	}

	g.playerX = max(0, min(screenWidth-20, g.playerX))
	g.playerY = max(0, min(screenHeight-20, g.playerY))

	if rand.Float64() < 0.03 {
		g.enemies = append(g.enemies, Enemy{
			x: float64(rand.Intn(screenWidth - 20)),
			y: float64(rand.Intn(screenHeight - 20)),
		})
	}

	for _, e := range g.enemies {
		if abs(g.playerX-e.x) < 20 && abs(g.playerY-e.y) < 20 {
			return fmt.Errorf("ゲームオーバー！スコア: %d", g.score)
		}
	}

	g.score++
	return nil
}

func (g *Game) Draw(screen *ebiten.Image) {
	screen.Fill(color.Black)
	ebitenutil.DrawRect(screen, g.playerX, g.playerY, 20, 20, color.RGBA{0, 0, 255, 255})

	for _, e := range g.enemies {
		ebitenutil.DrawRect(screen, e.x, e.y, 20, 20, color.RGBA{255, 0, 0, 255})
	}

	ebitenutil.DebugPrint(screen, fmt.Sprintf("スコア: %d", g.score))
}

func (g *Game) Layout(outsideWidth, outsideHeight int) (int, int) {
	return screenWidth, screenHeight
}

func main() {
	ebiten.SetWindowSize(screenWidth, screenHeight)
	ebiten.SetWindowTitle("シンプル・サバイバー")
	if err := ebiten.RunGame(&Game{}); err != nil {
		log.Fatal(err)
	}
}

func max(a, b float64) float64 {
	if a > b {
		return a
	}
	return b
}

func min(a, b float64) float64 {
	if a < b {
		return a
	}
	return b
}

func abs(a float64) float64 {
	if a < 0 {
		return -a
	}
	return a
}
