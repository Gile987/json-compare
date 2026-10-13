import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Difference } from '../compare/compare';

const CHANGE_PRESENTATION = {
  added: { label: 'Added', badgeClass: 'badge badge-added' },
  removed: { label: 'Removed', badgeClass: 'badge badge-removed' },
  'type-changed': { label: 'Type changed', badgeClass: 'badge badge-type-changed' },
} satisfies Record<Difference['kind'], { label: string; badgeClass: string }>;

const MISSING_TYPE_LABEL = '—';

@Component({
  imports: [],
  selector: 'app-results',
  styleUrl: './results.scss',
  templateUrl: './results.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Results {
  readonly differences = input.required<readonly Difference[] | null>();

  protected readonly changePresentation = CHANGE_PRESENTATION;
  protected readonly changeCounts = computed(() => {
    const counts: Record<Difference['kind'], number> = {
      added: 0,
      removed: 0,
      'type-changed': 0,
    };
    for (const difference of this.differences() ?? []) {
      counts[difference.kind]++;
    }
    return counts;
  });

  protected baselineTypeOf(difference: Difference): string {
    return difference.kind === 'added' ? MISSING_TYPE_LABEL : difference.baselineType;
  }

  protected updatedTypeOf(difference: Difference): string {
    return difference.kind === 'removed' ? MISSING_TYPE_LABEL : difference.updatedType;
  }
}
