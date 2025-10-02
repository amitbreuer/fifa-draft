# FIFA Draft Application ⚽

A web-based FIFA Ultimate Team draft simulator that allows multiple managers to draft players and build their dream teams.

## Features

- 🎮 **Snake Draft System** - Fair drafting with alternating pick order
- 👥 **Multi-Manager Support** - Draft with 2-8 managers
- ⚽ **Formation Builder** - Choose from 30+ real FIFA formations
- 🔄 **Drag & Drop** - Easy player positioning with intuitive drag-and-drop
- 📊 **Player Comparison** - Compare two players side-by-side by their stats
- 💾 **Auto-Save** - Your draft is automatically saved to browser storage
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile devices

## Getting Started

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   ng serve
   ```
4. Open your browser and navigate to `http://localhost:4200`

## How to Play

### 1. Draft Setup

1. **Enter Manager Names**
   - On the settings page, add the names of all managers participating in the draft
   - You need at least 2 managers to start
   - Each manager will take turns picking players

2. **Create Draft Name**
   - Give your draft a unique name (e.g., "Friends League 2024")
   - This allows you to save and resume drafts later

3. **Start the Draft**
   - Click "Start Draft" to begin
   - The draft uses a snake system: round 1 goes 1→2→3, round 2 goes 3→2→1, etc.

### 2. Player Selection

1. **Browse Players**
   - View all available FIFA players in the table
   - Use filters to narrow down by:
     - **Team** - Filter by club
     - **Position** - Filter by one or multiple positions (GK, CB, ST, etc.)
     - **Nationality** - Filter by country
     - **Show Selected** - View already drafted players

2. **View Player Details**
   - Click on any player's name to view detailed stats
   - See their preferred foot, weak foot rating, alternate positions, and all individual stats
   - Compare players by clicking the "Compare" button (👥 icon) in the player details dialog

3. **Compare Players**
   - Select a player to view their details
   - Click the compare icon in the top right of the dialog
   - Choose a second player from the searchable dropdown
   - View side-by-side stat comparisons including:
     - Overall ratings
     - Positions and alternate positions
     - Preferred foot and weak foot
     - All main stats (Pace, Shooting, Passing, Dribbling, Defending, Physicality)
     - Detailed sub-stats for each category

4. **Select a Player**
   - Click the radio button next to any player to select them
   - The player's name is automatically copied to your clipboard for easy sharing
   - Once selected, the player appears in the "Current Pick" area

### 3. Building Your Team

1. **Choose Formation**
   - Select your preferred formation from the dropdown (default: 4-3-3 Attack)
   - Available formations include popular FIFA formations like 4-3-3, 4-4-2, 3-5-2, etc.
   - When changing formations, players are automatically repositioned:
     - First, tries to keep players in the same position
     - Then, tries alternate positions the player can play
     - Then, moves to similar positions (e.g., defenders stay in defense)
     - Finally, places in any available spot or moves to bench

2. **Place Player on Field**
   - Click on any empty position on the field to place your selected player
   - Each formation has 11 positions (including goalkeeper)
   - If you place a player in an occupied position, the existing player moves to the bench

3. **Place Player on Bench**
   - Click "Place on Bench" to add the player to your substitutes
   - Maximum 7 players on the bench

4. **Manage Your Squad**
   - **Drag & Drop**: Move players between positions by dragging their cards
   - **Field to Field**: Swap positions between two players
   - **Bench to Field**: Drag a bench player to replace someone on the field
   - **Field to Bench**: Drag a field player to the bench (if space available)

5. **Undo Actions**
   - Use the "Undo" button to reverse your last action
   - You can undo multiple times during your turn
   - Players remain disabled in the table until their original placement is undone

### 4. Completing Your Turn

1. **Finish Turn**
   - Once you're happy with your pick and placement, click "Finish Turn"
   - The player becomes locked to your team
   - The draft automatically moves to the next manager

2. **Next Manager**
   - Each manager sees only their own team
   - Previously selected players appear disabled in the player table
   - Continue until all rounds are complete (default: 18 rounds)

### 5. Draft Summary

1. **View Final Teams**
   - After all rounds are complete, view the summary page
   - See all managers' complete teams
   - Scrollable player lists for easy viewing
   - Each player shows their rating, photo, and club

2. **Export/Share**
   - Teams are saved automatically in browser storage

## Technical Details

### Built With
- **Angular** - Frontend framework
- **PrimeNG** - UI component library
- **TypeScript** - Programming language
- **RxJS** - Reactive programming

### Data Source
Player data includes FIFA ratings, stats, positions, and club information.

## Future Enhancements

- Online multiplayer support
- Custom player pools
- Chemistry calculations
- Team export to image
- Draft history and statistics

## License

This project is for educational and entertainment purposes.

---

**Enjoy your draft!** ⚽🏆
