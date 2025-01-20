package main

import (
	"fmt"
	"image/color"
	"log"
	"math"
	"math/rand"
	"time"

	"github.com/hajimehoshi/ebiten/v2"
	"github.com/hajimehoshi/ebiten/v2/ebitenutil"
)

const (
	screenWidth        = 800
	screenHeight       = 600
	enemySpawnInterval = 1.0 // 敵の出現間隔（秒）
)

// 武器の種類
type WeaponType int

const (
	WeaponMelee  WeaponType = iota // 近接武器（回転攻撃）
	WeaponRanged                   // 遠距離武器（直線攻撃）
	WeaponAura                     // オーラ攻撃（常時ダメージ）
	WeaponSpiral                   // 螺旋攻撃
)

// 攻撃の方向（ラジアン）
type AttackDirection struct {
	angle float64
	speed float64 // 弾の移動速度（螺旋攻撃用）
}

// スキルの種類
type SkillType int

const (
	SkillNewWeapon SkillType = iota
	SkillWeaponUpgrade
	SkillHpUp
	SkillSpeedUp
)

// 敵の種類
type EnemyType int

const (
	EnemyNormal EnemyType = iota // 通常の敵
	EnemyFast                    // 速い敵
	EnemyTank                    // 体力が多い敵
	EnemyBoss                    // ボス敵
)

// スキル選択肢
type SkillOption struct {
	skillType   SkillType
	description string
}

// 武器の基本パラメータ
type WeaponParams struct {
	attackInterval  float64 // 攻撃間隔
	attackRange     float64 // 攻撃範囲
	attackDamage    int     // 攻撃力
	weaponType      WeaponType
	projectileSpeed float64 // 弾の速度（遠距離武器用）
}

// 武器インスタンス
type Weapon struct {
	params         WeaponParams
	lastAttackTime float64
	level          int
	direction      AttackDirection
	projectiles    []Projectile // 弾のリスト
}

// 弾のデータ
type Projectile struct {
	x, y     float64
	angle    float64
	speed    float64
	damage   int
	lifeTime float64
}

// 基本武器パラメータ
var (
	meleeWeaponParams = WeaponParams{
		attackInterval:  0.5,
		attackRange:     100.0,
		attackDamage:    5,
		weaponType:      WeaponMelee,
		projectileSpeed: 0,
	}
	rangedWeaponParams = WeaponParams{
		attackInterval:  1.0,
		attackRange:     300.0,
		attackDamage:    3,
		weaponType:      WeaponRanged,
		projectileSpeed: 5.0,
	}
	auraWeaponParams = WeaponParams{
		attackInterval:  0.1,
		attackRange:     80.0,
		attackDamage:    2,
		weaponType:      WeaponAura,
		projectileSpeed: 0,
	}
	spiralWeaponParams = WeaponParams{
		attackInterval:  0.2,
		attackRange:     200.0,
		attackDamage:    4,
		weaponType:      WeaponSpiral,
		projectileSpeed: 3.0,
	}
)

// 敵の基本パラメータ
var enemyParams = map[EnemyType]struct {
	hp    int
	speed float64
	size  float64
	exp   int
	score int
}{
	EnemyNormal: {hp: 10, speed: 2, size: 24, exp: 20, score: 10},
	EnemyFast:   {hp: 5, speed: 4, size: 20, exp: 15, score: 15},
	EnemyTank:   {hp: 30, speed: 1, size: 32, exp: 40, score: 30},
	EnemyBoss:   {hp: 100, speed: 1.5, size: 48, exp: 200, score: 100},
}

// Game はゲームの状態を管理する構造体です
type Game struct {
	player         *Player
	enemies        []*Enemy
	lastEnemySpawn float64
	gameOver       bool
	score          int
	skillOptions   []SkillOption
	choosingSkill  bool
	startTime      float64
}

// Player はプレイヤーキャラクターを表す構造体です
type Player struct {
	x, y           float64
	speed          float64
	hp             int
	maxHp          int
	level          int
	exp            int
	expToNextLevel int
	weapons        []*Weapon
}

// Enemy は敵キャラクターを表す構造体です
type Enemy struct {
	x, y      float64
	speed     float64
	hp        int
	maxHp     int
	size      float64
	enemyType EnemyType
	expValue  int // 倒した時に得られる経験値
	score     int // 倒した時に得られるスコア
}

func NewGame() *Game {
	player := &Player{
		x:              float64(screenWidth) / 2,
		y:              float64(screenHeight) / 2,
		speed:          4,
		hp:             100,
		maxHp:          100,
		level:          1,
		exp:            0,
		expToNextLevel: 100,
		weapons: []*Weapon{
			{
				params:         meleeWeaponParams,
				lastAttackTime: 0,
				level:          1,
				direction:      AttackDirection{angle: 0, speed: 0},
				projectiles:    make([]Projectile, 0),
			},
		},
	}

	return &Game{
		player:    player,
		enemies:   make([]*Enemy, 0),
		score:     0,
		startTime: float64(time.Now().UnixNano()) / 1e9,
	}
}

func (g *Game) generateSkillOptions() {
	g.skillOptions = make([]SkillOption, 3)

	availableSkills := []SkillOption{
		{SkillNewWeapon, "新しい武器を獲得"},
		{SkillWeaponUpgrade, "武器の強化 (+攻撃力)"},
		{SkillHpUp, "最大HPの増加 (+50)"},
		{SkillSpeedUp, "移動速度上昇 (+0.5)"},
	}

	// 3つのスキルをランダムに選択
	for i := 0; i < 3; i++ {
		idx := rand.Intn(len(availableSkills))
		g.skillOptions[i] = availableSkills[idx]
		availableSkills = append(availableSkills[:idx], availableSkills[idx+1:]...)
	}
}

func (g *Game) applySkill(skillType SkillType) {
	switch skillType {
	case SkillNewWeapon:
		if len(g.player.weapons) < 4 {
			weaponTypes := []WeaponParams{rangedWeaponParams, auraWeaponParams, spiralWeaponParams}
			newWeapon := weaponTypes[rand.Intn(len(weaponTypes))]
			g.player.weapons = append(g.player.weapons, &Weapon{
				params:         newWeapon,
				lastAttackTime: 0,
				level:          1,
				direction:      AttackDirection{angle: 0, speed: 0},
				projectiles:    make([]Projectile, 0),
			})
		}
	case SkillWeaponUpgrade:
		for _, weapon := range g.player.weapons {
			weapon.params.attackDamage += 5
		}
	case SkillHpUp:
		g.player.maxHp += 50
		g.player.hp += 50
	case SkillSpeedUp:
		g.player.speed += 0.5
	}
	g.choosingSkill = false
}

func (p *Player) gainExp(exp int) bool {
	p.exp += exp
	if p.exp >= p.expToNextLevel {
		p.level++
		p.exp = 0
		p.expToNextLevel = p.level * 100
		return true
	}
	return false
}

func (g *Game) spawnEnemy() {
	var x, y float64
	side := rand.Intn(4)
	switch side {
	case 0: // 上
		x = rand.Float64() * screenWidth
		y = -30
	case 1: // 右
		x = screenWidth + 30
		y = rand.Float64() * screenHeight
	case 2: // 下
		x = rand.Float64() * screenWidth
		y = screenHeight + 30
	case 3: // 左
		x = -30
		y = rand.Float64() * screenHeight
	}

	// 時間経過で出現する敵の種類を変える
	gameTime := float64(time.Now().UnixNano())/1e9 - g.startTime
	var enemyType EnemyType
	switch {
	case gameTime > 300: // 5分以降
		if rand.Float64() < 0.1 { // 10%の確率でボス
			enemyType = EnemyBoss
		} else {
			enemyType = EnemyType(rand.Intn(3)) // その他
		}
	case gameTime > 180: // 3分以降
		enemyType = EnemyType(rand.Intn(3)) // Normal, Fast, Tank
	case gameTime > 60: // 1分以降
		enemyType = EnemyType(rand.Intn(2)) // Normal, Fast
	default:
		enemyType = EnemyNormal
	}

	params := enemyParams[enemyType]
	enemy := &Enemy{
		x:         x,
		y:         y,
		speed:     params.speed,
		hp:        params.hp,
		maxHp:     params.hp,
		size:      params.size,
		enemyType: enemyType,
		expValue:  params.exp,
		score:     params.score,
	}
	g.enemies = append(g.enemies, enemy)
}

func (g *Game) attack(weapon *Weapon) {
	now := float64(time.Now().UnixNano()) / 1e9

	switch weapon.params.weaponType {
	case WeaponMelee:
		// 回転攻撃
		weapon.direction.angle += math.Pi / 4 // 45度ずつ回転
		for _, enemy := range g.enemies {
			dx := enemy.x - g.player.x
			dy := enemy.y - g.player.y
			dist := math.Sqrt(dx*dx + dy*dy)
			if dist <= weapon.params.attackRange {
				enemy.hp -= weapon.params.attackDamage
				g.checkEnemyDeath(enemy)
			}
		}

	case WeaponRanged:
		// 最も近い敵に向かって直線攻撃
		var nearestEnemy *Enemy
		nearestDist := math.MaxFloat64
		for _, enemy := range g.enemies {
			dx := enemy.x - g.player.x
			dy := enemy.y - g.player.y
			dist := math.Sqrt(dx*dx + dy*dy)
			if dist < nearestDist {
				nearestDist = dist
				nearestEnemy = enemy
			}
		}
		if nearestEnemy != nil {
			dx := nearestEnemy.x - g.player.x
			dy := nearestEnemy.y - g.player.y
			angle := math.Atan2(dy, dx)
			weapon.projectiles = append(weapon.projectiles, Projectile{
				x:        g.player.x,
				y:        g.player.y,
				angle:    angle,
				speed:    weapon.params.projectileSpeed,
				damage:   weapon.params.attackDamage,
				lifeTime: now,
			})
		}

	case WeaponAura:
		// 常時ダメージ
		for _, enemy := range g.enemies {
			dx := enemy.x - g.player.x
			dy := enemy.y - g.player.y
			dist := math.Sqrt(dx*dx + dy*dy)
			if dist <= weapon.params.attackRange {
				enemy.hp -= weapon.params.attackDamage
				g.checkEnemyDeath(enemy)
			}
		}

	case WeaponSpiral:
		// 螺旋攻撃
		weapon.direction.angle += math.Pi / 8
		weapon.projectiles = append(weapon.projectiles, Projectile{
			x:        g.player.x,
			y:        g.player.y,
			angle:    weapon.direction.angle,
			speed:    weapon.params.projectileSpeed,
			damage:   weapon.params.attackDamage,
			lifeTime: now,
		})
	}

	// 弾の更新と当たり判定
	var remainingProjectiles []Projectile
	for _, proj := range weapon.projectiles {
		if now-proj.lifeTime > 2.0 { // 2秒で消滅
			continue
		}

		// 弾の移動
		proj.x += math.Cos(proj.angle) * proj.speed
		proj.y += math.Sin(proj.angle) * proj.speed

		// 敵との当たり判定
		for _, enemy := range g.enemies {
			dx := enemy.x - proj.x
			dy := enemy.y - proj.y
			dist := math.Sqrt(dx*dx + dy*dy)
			if dist < enemy.size/2 {
				enemy.hp -= proj.damage
				g.checkEnemyDeath(enemy)
				continue
			}
		}

		remainingProjectiles = append(remainingProjectiles, proj)
	}
	weapon.projectiles = remainingProjectiles
}

func (g *Game) checkEnemyDeath(enemy *Enemy) {
	if enemy.hp <= 0 {
		g.score += enemy.score
		if g.player.gainExp(enemy.expValue) {
			g.choosingSkill = true
			g.generateSkillOptions()
		}
	}
}

func (g *Game) Update() error {
	if g.gameOver {
		if ebiten.IsKeyPressed(ebiten.KeyR) {
			*g = *NewGame()
		}
		return nil
	}

	if g.choosingSkill {
		// スキル選択の処理
		if ebiten.IsKeyPressed(ebiten.Key1) {
			g.applySkill(g.skillOptions[0].skillType)
		} else if ebiten.IsKeyPressed(ebiten.Key2) {
			g.applySkill(g.skillOptions[1].skillType)
		} else if ebiten.IsKeyPressed(ebiten.Key3) {
			g.applySkill(g.skillOptions[2].skillType)
		}
		return nil
	}

	// プレイヤーの移動処理
	if ebiten.IsKeyPressed(ebiten.KeyW) {
		g.player.y -= g.player.speed
	}
	if ebiten.IsKeyPressed(ebiten.KeyS) {
		g.player.y += g.player.speed
	}
	if ebiten.IsKeyPressed(ebiten.KeyA) {
		g.player.x -= g.player.speed
	}
	if ebiten.IsKeyPressed(ebiten.KeyD) {
		g.player.x += g.player.speed
	}

	// 敵の生成
	now := float64(time.Now().UnixNano()) / 1e9
	if now-g.lastEnemySpawn >= enemySpawnInterval {
		g.spawnEnemy()
		g.lastEnemySpawn = now
	}

	// 武器の攻撃処理
	for _, weapon := range g.player.weapons {
		if now-weapon.lastAttackTime >= weapon.params.attackInterval {
			g.attack(weapon)
			weapon.lastAttackTime = now
		}
	}

	// 敵の更新と衝突判定
	newEnemies := make([]*Enemy, 0)
	for _, enemy := range g.enemies {
		enemy.update(g.player.x, g.player.y)

		// プレイヤーとの衝突判定
		dx := g.player.x - enemy.x
		dy := g.player.y - enemy.y
		dist := math.Sqrt(dx*dx + dy*dy)
		if dist < enemy.size/2+16 { // プレイヤーのサイズの半分を加算
			g.player.hp -= 1
			if g.player.hp <= 0 {
				g.gameOver = true
				return nil
			}
		}

		if enemy.hp > 0 {
			newEnemies = append(newEnemies, enemy)
		}
	}
	g.enemies = newEnemies

	return nil
}

func (e *Enemy) update(playerX, playerY float64) {
	dx := playerX - e.x
	dy := playerY - e.y
	dist := math.Sqrt(dx*dx + dy*dy)
	if dist > 0 {
		e.x += (dx / dist) * e.speed
		e.y += (dy / dist) * e.speed
	}
}

func (g *Game) Draw(screen *ebiten.Image) {
	if g.choosingSkill {
		// スキル選択画面の描画
		bgImg := ebiten.NewImage(screenWidth, screenHeight)
		bgImg.Fill(color.RGBA{0, 0, 0, 200})
		screen.DrawImage(bgImg, &ebiten.DrawImageOptions{})

		// タイトルテキストを描画
		ebitenutil.DebugPrint(screen, "レベルアップ！ スキルを選択してください (1-3)")

		for i, skill := range g.skillOptions {
			// スキル選択ボタンの背景
			skillImg := ebiten.NewImage(400, 50)
			skillImg.Fill(color.RGBA{50, 50, 50, 255})
			op := &ebiten.DrawImageOptions{}
			op.GeoM.Translate(float64(screenWidth/2-200), float64(screenHeight/2-75+i*60))
			screen.DrawImage(skillImg, op)

			// スキルの説明テキストを描画
			text := fmt.Sprintf("%d: %s", i+1, skill.description)
			ebitenutil.DebugPrintAt(screen, text, screenWidth/2-180, screenHeight/2-60+i*60)
		}
		return
	}

	// プレイヤーの描画
	playerImg := ebiten.NewImage(32, 32)
	playerImg.Fill(color.RGBA{0, 0, 255, 255})
	op := &ebiten.DrawImageOptions{}
	op.GeoM.Translate(g.player.x-16, g.player.y-16)
	screen.DrawImage(playerImg, op)

	// 武器の攻撃範囲と弾の描画
	for _, weapon := range g.player.weapons {
		// 攻撃範囲の描画
		attackRangeImg := ebiten.NewImage(int(weapon.params.attackRange*2), int(weapon.params.attackRange*2))
		switch weapon.params.weaponType {
		case WeaponMelee:
			attackRangeImg.Fill(color.RGBA{0, 255, 0, 64})
		case WeaponRanged:
			attackRangeImg.Fill(color.RGBA{255, 255, 0, 64})
		case WeaponAura:
			attackRangeImg.Fill(color.RGBA{0, 0, 255, 64})
		case WeaponSpiral:
			attackRangeImg.Fill(color.RGBA{255, 0, 255, 64})
		}
		op = &ebiten.DrawImageOptions{}
		op.GeoM.Translate(g.player.x-weapon.params.attackRange, g.player.y-weapon.params.attackRange)
		screen.DrawImage(attackRangeImg, op)

		// 弾の描画
		for _, proj := range weapon.projectiles {
			projImg := ebiten.NewImage(8, 8)
			projImg.Fill(color.RGBA{255, 255, 255, 255})
			op := &ebiten.DrawImageOptions{}
			op.GeoM.Translate(proj.x-4, proj.y-4)
			screen.DrawImage(projImg, op)
		}
	}

	// 敵の描画
	for _, enemy := range g.enemies {
		// 敵の種類に応じた色を設定
		var enemyColor color.RGBA
		switch enemy.enemyType {
		case EnemyFast:
			enemyColor = color.RGBA{255, 165, 0, 255} // オレンジ
		case EnemyTank:
			enemyColor = color.RGBA{128, 0, 0, 255} // 濃い赤
		case EnemyBoss:
			enemyColor = color.RGBA{148, 0, 211, 255} // 紫
		default:
			enemyColor = color.RGBA{255, 0, 0, 255} // 赤
		}

		enemyImg := ebiten.NewImage(int(enemy.size), int(enemy.size))
		enemyImg.Fill(enemyColor)
		op := &ebiten.DrawImageOptions{}
		op.GeoM.Translate(enemy.x-enemy.size/2, enemy.y-enemy.size/2)
		screen.DrawImage(enemyImg, op)

		// HPバーの描画
		if enemy.hp < enemy.maxHp {
			hpBarWidth := enemy.size
			hpBarHeight := 4.0

			// HPバーの背景
			hpBarBg := ebiten.NewImage(int(hpBarWidth), int(hpBarHeight))
			hpBarBg.Fill(color.RGBA{100, 100, 100, 255})
			op = &ebiten.DrawImageOptions{}
			op.GeoM.Translate(enemy.x-hpBarWidth/2, enemy.y-enemy.size/2-8)
			screen.DrawImage(hpBarBg, op)

			// 現在のHP
			currentHpWidth := (float64(enemy.hp) / float64(enemy.maxHp)) * hpBarWidth
			if currentHpWidth > 0 {
				hpBar := ebiten.NewImage(int(currentHpWidth), int(hpBarHeight))
				hpBar.Fill(color.RGBA{255, 0, 0, 255})
				op = &ebiten.DrawImageOptions{}
				op.GeoM.Translate(enemy.x-hpBarWidth/2, enemy.y-enemy.size/2-8)
				screen.DrawImage(hpBar, op)
			}
		}
	}

	// HPバーの描画
	hpBarWidth := 200
	hpBarHeight := 20
	hpBarX := 10
	hpBarY := 10

	// HPバーの背景
	hpBarBg := ebiten.NewImage(hpBarWidth, hpBarHeight)
	hpBarBg.Fill(color.RGBA{100, 100, 100, 255})
	op = &ebiten.DrawImageOptions{}
	op.GeoM.Translate(float64(hpBarX), float64(hpBarY))
	screen.DrawImage(hpBarBg, op)

	// 現在のHP
	currentHpWidth := int(float64(hpBarWidth) * float64(g.player.hp) / float64(g.player.maxHp))
	if currentHpWidth > 0 {
		hpBar := ebiten.NewImage(currentHpWidth, hpBarHeight)
		hpBar.Fill(color.RGBA{0, 255, 0, 255})
		op = &ebiten.DrawImageOptions{}
		op.GeoM.Translate(float64(hpBarX), float64(hpBarY))
		screen.DrawImage(hpBar, op)
	}

	// 経験値バーの描画
	expBarY := float64(hpBarY + hpBarHeight + 5)
	expBarBg := ebiten.NewImage(hpBarWidth, hpBarHeight)
	expBarBg.Fill(color.RGBA{50, 50, 100, 255})
	op = &ebiten.DrawImageOptions{}
	op.GeoM.Translate(float64(hpBarX), expBarY)
	screen.DrawImage(expBarBg, op)

	expWidth := int(float64(hpBarWidth) * float64(g.player.exp) / float64(g.player.expToNextLevel))
	if expWidth > 0 {
		expBar := ebiten.NewImage(expWidth, hpBarHeight)
		expBar.Fill(color.RGBA{0, 0, 255, 255})
		op = &ebiten.DrawImageOptions{}
		op.GeoM.Translate(float64(hpBarX), expBarY)
		screen.DrawImage(expBar, op)
	}

	// レベルとスコアの表示
	levelText := fmt.Sprintf("Level: %d  Score: %d", g.player.level, g.score)
	ebitenutil.DebugPrintAt(screen, levelText, 10, 50)

	// 経過時間の表示
	gameTime := float64(time.Now().UnixNano())/1e9 - g.startTime
	timeText := fmt.Sprintf("Time: %.1f", gameTime)
	ebitenutil.DebugPrintAt(screen, timeText, 10, 70)

	// ゲームオーバー表示
	if g.gameOver {
		gameOverImg := ebiten.NewImage(screenWidth, screenHeight)
		gameOverImg.Fill(color.RGBA{0, 0, 0, 128})
		screen.DrawImage(gameOverImg, &ebiten.DrawImageOptions{})
		ebitenutil.DebugPrintAt(screen, "GAME OVER - Press R to Restart", screenWidth/2-100, screenHeight/2)
	}
}

func (g *Game) Layout(outsideWidth, outsideHeight int) (int, int) {
	return screenWidth, screenHeight
}

func main() {
	rand.Seed(time.Now().UnixNano())
	ebiten.SetWindowSize(screenWidth, screenHeight)
	ebiten.SetWindowTitle("Vampire Survivors Like")

	game := NewGame()
	if err := ebiten.RunGame(game); err != nil {
		log.Fatal(err)
	}
}
