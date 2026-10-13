import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Difference } from '../compare/compare';
import { Results } from './results';

describe('Results', () => {
  let fixture: ComponentFixture<Results>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Results],
    }).compileComponents();
    fixture = TestBed.createComponent(Results);
  });

  function render(differences: readonly Difference[] | null): HTMLElement {
    fixture.componentRef.setInput('differences', differences);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the initial placeholder before any comparison', () => {
    const element = render(null);
    expect(element.textContent).toContain('Paste two JSON responses and choose Compare');
    expect(element.querySelector('table')).toBeNull();
  });

  it('shows the zero-change message after a comparison without differences', () => {
    const element = render([]);
    expect(element.textContent).toContain(
      'No structural differences found. Primitive values and array contents are not compared.',
    );
    expect(element.textContent).not.toContain('Paste two JSON responses and choose Compare');
  });

  it('always shows the array limitation note', () => {
    for (const state of [null, []] as const) {
      const element = render(state);
      expect(element.textContent).toContain(
        'Arrays are compared by type only; their items are not inspected.',
      );
    }
  });

  it('renders rows with text badges, types, and em dashes for missing sides', () => {
    const element = render([
      { kind: 'added', path: '$.permissions', updatedType: 'array' },
      { kind: 'removed', path: '$.user.name', baselineType: 'string' },
      {
        kind: 'type-changed',
        path: '$.price',
        baselineType: 'number',
        updatedType: 'string',
      },
    ]);

    expect(element.querySelector('.summary')?.textContent).toContain('3 changes');
    expect(element.querySelector('.summary')?.textContent).toContain('1 added');
    expect(element.querySelector('.summary')?.textContent).toContain('1 removed');
    expect(element.querySelector('.summary')?.textContent).toContain('1 type changed');

    const rows = [...element.querySelectorAll('tbody tr')];
    expect(rows).toHaveLength(3);

    const cellsOf = (row: Element) =>
      [...row.querySelectorAll('td')].map((cell) => cell.textContent?.trim());

    expect(cellsOf(rows[0])).toEqual(['$.permissions', 'Added', '—', 'array']);
    expect(cellsOf(rows[1])).toEqual(['$.user.name', 'Removed', 'string', '—']);
    expect(cellsOf(rows[2])).toEqual(['$.price', 'Type changed', 'number', 'string']);

    expect(rows[0].querySelector('.badge')?.classList.contains('badge-added')).toBe(true);
    expect(rows[1].querySelector('.badge')?.classList.contains('badge-removed')).toBe(true);
    expect(rows[2].querySelector('.badge')?.classList.contains('badge-type-changed')).toBe(true);
  });

  it('uses singular wording for a single change', () => {
    const element = render([{ kind: 'added', path: '$.a', updatedType: 'string' }]);
    expect(element.querySelector('.summary')?.textContent).toContain('1 change:');
  });
});
