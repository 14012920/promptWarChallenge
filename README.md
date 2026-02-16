# The BomberLegend: Evolved

**The BomberLegend: Evolved** is a modern reimagining of the classic action-maze genre, built from scratch with a custom Entity-Component-System (ECS) engine in TypeScript.

It features an intelligent **AI Director** that adapts the game's difficulty in real-time, smart enemies that flank and trap you, and a high-performance rendering engine.

## 🎮 How to Play

**Objective:** Destroy all enemies and survive! Drop bombs to clear obstacles and defeat foes.

### Controls
- **Move:** `Arrow Keys` or `W`, `A`, `S`, `D`
- **Drop Bomb:** `Spacebar`

### Gameplay Tips
- **Watch the Fuse:** Bombs explode after 3 seconds. Don't get caught in your own blast!
- **Chain Reactions:** Bombs can trigger other bombs. Use this to create massive explosions.
- **Smart Enemies:** The orange balloons will wander, but red ones might chase you. Be careful!

## 🚀 Key Features

- **Custom ECS Engine**: High-performance architecture separating logic, data, and rendering.
- **AI Director**: A dynamic system that monitors gameplay and adjusts intensity.
- **Smart Grid System**: Influence maps help AI agents make tactical decisions.
- **Modern Tech Stack**: Built with Vite, TypeScript, and HTML5 Canvas.
- **Cross-Platform**: Runs in any modern web browser.

## 🛠️ Development

### Prerequisites
- Node.js (v18+)

### Setup
```bash
npm install
npm run dev
```

### Deployment
The project includes a `Dockerfile` for Cloud Run deployment.
```bash
gcloud run deploy bomber-legend --source .
```
