import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DraftService } from '../../services/draft.service';
import { DraftApiService, DraftState } from '../../services/draft-api.service';
import { PlayerService } from '../../services/player.service';
import { DraftSettings, DraftManager, Player } from '../../types';

@Component({
  selector: 'app-summary',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.scss'
})
export class SummaryComponent implements OnInit {
  draftSettings: DraftSettings | null = null;
  managers: DraftManager[] = [];
  activeIndex = 0;
  viewMode: 'pitch' | 'list' = 'pitch';
  loading = true;

  private readonly ATT = ['ST', 'CF', 'LW', 'RW'];
  private readonly MID = ['CAM', 'LAM', 'RAM', 'CM', 'LCM', 'RCM', 'LM', 'RM', 'CDM'];
  private readonly DEF = ['CB', 'LB', 'RB', 'LWB', 'RWB', 'GK'];

  // Out-of-position penalty tuning.
  private readonly STEP_PENALTY = 2;      // per adjacency step between roles
  private readonly GK_MISMATCH_PENALTY = 30; // non-GK at GK, or GK played outfield

  // Role-adjacency graph: positions one "natural conversion" apart. GK is
  // intentionally isolated (any GK mismatch is catastrophic). Distances between
  // roles drive the out-of-position penalty (distance * STEP_PENALTY).
  private readonly POSITION_LINKS: Record<string, string[]> = this.buildPositionGraph([
    ['CB', 'CDM'], ['CB', 'LB'], ['CB', 'RB'],
    ['LB', 'LWB'], ['LB', 'LM'],
    ['RB', 'RWB'], ['RB', 'RM'],
    ['LWB', 'LM'], ['LWB', 'LW'],
    ['RWB', 'RM'], ['RWB', 'RW'],
    ['CDM', 'CM'],
    ['CM', 'CAM'], ['CM', 'LM'], ['CM', 'RM'],
    ['LM', 'LW'], ['LM', 'LAM'],
    ['RM', 'RW'], ['RM', 'RAM'],
    ['LAM', 'LW'], ['LAM', 'CAM'],
    ['RAM', 'RW'], ['RAM', 'CAM'],
    ['CAM', 'CF'], ['CAM', 'ST'],
    ['LW', 'RW'], ['LW', 'CF'],
    ['RW', 'CF'],
    ['CF', 'ST'],
  ]);

  constructor(
    private draftService: DraftService,
    private api: DraftApiService,
    private playerService: PlayerService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const code = this.route.snapshot.queryParamMap.get('code');
    if (code) {
      this.loadMultiplayerSummary(code);
    } else {
      this.loadLocalSummary();
    }
  }

  private loadLocalSummary(): void {
    this.draftService.draftSettings$.subscribe(settings => {
      if (!settings) {
        this.router.navigate(['/']);
        return;
      }
      this.draftSettings = settings;
      this.managers = settings.managers;
      this.reconcileSquads();
      this.loading = false;
    });
  }

  private loadMultiplayerSummary(code: string): void {
    this.api.getDraftState(code).subscribe({
      next: (state) => {
        this.draftSettings = this.buildSettingsFromServer(state);
        this.managers = this.draftSettings.managers;
        this.reconcileSquads();
        this.loading = false;
      },
      error: () => {
        this.router.navigate(['/']);
      }
    });
  }

  /**
   * Ensure every drafted player appears on the pitch or the bench. Earlier
   * squad-save races could drop a picked player from both, leaving it only in
   * the pick list. Any such orphan is added back to the bench so the pitch
   * view matches the picks list.
   */
  private reconcileSquads(): void {
    for (const manager of this.managers) {
      const onField = new Set(
        (manager.fieldPositions ?? [])
          .filter(p => p.player)
          .map(p => p.player!.id)
      );
      const bench = [...(manager.benchPlayers ?? [])];
      const onBench = new Set(bench.map(p => p.id));
      for (const player of manager.team) {
        if (!onField.has(player.id) && !onBench.has(player.id)) {
          bench.push(player);
          onBench.add(player.id);
        }
      }
      manager.benchPlayers = bench;
    }
  }

  private buildSettingsFromServer(state: DraftState): DraftSettings {
    return {
      managers: state.managers.map(m => ({
        id: m.id,
        name: m.username ? `@${m.username}` : m.firstName || `Manager ${m.slotIndex + 1}`,
        team: state.picks
          .filter(p => p.managerId === m.id)
          .sort((a, b) => a.pickOrder - b.pickOrder)
          .map(p => this.playerService.getPlayerById(p.playerId))
          .filter((p): p is Player => !!p),
        formation: m.formation as any,
        fieldPositions: m.fieldPositions as any,
        benchPlayers: (m.benchPlayerIds || [])
          .map((id: number) => this.playerService.getPlayerById(id))
          .filter((p): p is Player => !!p),
      })),
      currentManagerIndex: state.currentManagerIndex,
      currentRound: state.currentRound,
      isSnakeDirection: state.isSnakeDirection,
      maxRounds: state.maxRounds,
      draftName: state.name,
    };
  }

  selectManager(i: number): void {
    this.activeIndex = i;
  }

  playerName(player: Player): string {
    return player.commonName || `${player.firstName} ${player.lastName}`.trim();
  }

  positionLabel(positionId: string): string {
    return positionId.replace(/_\d+$/, '').toUpperCase();
  }

  onImageError(event: any): void {
    event.target.src = 'iniesta.jpg';
  }

  /** Rating tier class matching the player table (85+ high, 75+ mid, else low). */
  ratingClass(rating: number): string {
    if (rating >= 85) return 'ovr-high';
    if (rating >= 75) return 'ovr-mid';
    return 'ovr-low';
  }

  /**
   * Average rating for a pitch line, based on the slot each player was placed
   * in (not their natural position). Bench players are excluded. Players placed
   * out of their eligible positions (natural + alternates) count at a reduced
   * rating: distance * STEP_PENALTY between roles, or GK_MISMATCH_PENALTY for
   * any goalkeeper mismatch.
   */
  private avgFor(manager: DraftManager, positions: string[]): number {
    const ratings = (manager.fieldPositions ?? [])
      .filter(pos => pos.player && positions.includes(this.positionLabel(pos.id)))
      .map(pos => this.effectiveRating(pos.player!, this.positionLabel(pos.id)));
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((s, r) => s + r, 0);
    return Math.round(sum / ratings.length);
  }

  /** Rating a player contributes when placed in a given slot position. */
  private effectiveRating(player: Player, slotLabel: string): number {
    const penalty = this.outOfPositionPenalty(player, slotLabel);
    return Math.max(0, player.overallRating - penalty);
  }

  /** Penalty for playing a player in `slotLabel` given their eligible roles. */
  private outOfPositionPenalty(player: Player, slotLabel: string): number {
    const slot = this.normalizePos(slotLabel);
    const eligible = this.eligiblePositions(player);
    if (eligible.includes(slot)) return 0;

    // Any goalkeeper mismatch (outfielder at GK, or GK played outfield).
    if (slot === 'GK' || eligible.includes('GK')) return this.GK_MISMATCH_PENALTY;

    let best = Infinity;
    for (const from of eligible) {
      const dist = this.roleDistance(from, slot);
      if (dist < best) best = dist;
    }
    if (!isFinite(best)) return this.GK_MISMATCH_PENALTY;
    return best * this.STEP_PENALTY;
  }

  /** Player's eligible position codes (natural + alternates), normalized. */
  private eligiblePositions(player: Player): string[] {
    const codes = [player.position.shortLabel];
    for (const alt of player.alternatePositions ?? []) {
      codes.push(alt.shortLabel);
    }
    return codes.map(c => this.normalizePos(c));
  }

  /** Shortest-path distance between two roles in the adjacency graph. */
  private roleDistance(from: string, to: string): number {
    if (from === to) return 0;
    const visited = new Set<string>([from]);
    let frontier = [from];
    let depth = 0;
    while (frontier.length > 0) {
      depth++;
      const next: string[] = [];
      for (const node of frontier) {
        for (const neighbor of this.POSITION_LINKS[node] ?? []) {
          if (neighbor === to) return depth;
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            next.push(neighbor);
          }
        }
      }
      frontier = next;
    }
    return Infinity;
  }

  /** Normalize slot/position codes to canonical graph nodes. */
  private normalizePos(code: string): string {
    const c = code.toUpperCase();
    if (c === 'LCM' || c === 'RCM') return 'CM';
    return c;
  }

  /** Build a symmetric adjacency map from an edge list. */
  private buildPositionGraph(edges: [string, string][]): Record<string, string[]> {
    const graph: Record<string, string[]> = {};
    const add = (a: string, b: string) => {
      (graph[a] ??= []).push(b);
    };
    for (const [a, b] of edges) {
      add(a, b);
      add(b, a);
    }
    return graph;
  }

  attackAvg(manager: DraftManager): number { return this.avgFor(manager, this.ATT); }
  midfieldAvg(manager: DraftManager): number { return this.avgFor(manager, this.MID); }
  defenceAvg(manager: DraftManager): number { return this.avgFor(manager, this.DEF); }

  overallAvg(manager: DraftManager): number {
    if (manager.team.length === 0) return 0;
    const sum = manager.team.reduce((s, p) => s + p.overallRating, 0);
    return Math.round(sum / manager.team.length);
  }

  backToSettings(): void {
    this.router.navigate(['/']);
  }
}
