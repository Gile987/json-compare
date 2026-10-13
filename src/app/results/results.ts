import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Difference } from '../compare/compare';

@Component({
  imports: [],
  selector: 'app-results',
  styleUrl: './results.scss',
  templateUrl: './results.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Results {
  readonly differences = input.required<readonly Difference[] | null>();

  protected readonly addedCount = computed(() => this.countKind('added'));
  protected readonly removedCount = computed(() => this.countKind('removed'));
  protected readonly typeChangedCount = computed(() => this.countKind('type-changed'));
  protected readonly totalCount = computed(() => this.differences()?.length ?? 0);

  protected labelOf(difference: Difference): string {
    switch (difference.kind) {
      case 'added':
        return 'Added';
      case 'removed':
        return 'Removed';
      case 'type-changed':
        return 'Type changed';
    }
  }

  protected badgeClassOf(difference: Difference): string {
    switch (difference.kind) {
      case 'added':
        return 'badge badge-added';
      case 'removed':
        return 'badge badge-removed';
      case 'type-changed':
        return 'badge badge-type-changed';
    }
  }

  protected baselineTypeOf(difference: Difference): string {
    return difference.kind === 'added' ? '—' : difference.baselineType;
  }

  protected updatedTypeOf(difference: Difference): string {
    return difference.kind === 'removed' ? '—' : difference.updatedType;
  }

  private countKind(kind: Difference['kind']): number {
    return (this.differences() ?? []).filter((difference) => difference.kind === kind).length;
  }
}
