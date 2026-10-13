import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { DriftDetector } from './drift-detector';
import { JSON_DEPTH_ERROR } from '../compare/json-depth';

describe('DriftDetector', () => {
  let fixture: ComponentFixture<DriftDetector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriftDetector],
    }).compileComponents();
    fixture = TestBed.createComponent(DriftDetector);
    await fixture.whenStable();
  });

  function page(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function editor(id: string): HTMLTextAreaElement {
    const element = page().querySelector<HTMLTextAreaElement>(`#${id}`);
    if (!element) {
      throw new Error(`Editor #${id} not found`);
    }
    return element;
  }

  async function setEditorValue(id: string, value: string): Promise<void> {
    const textarea = editor(id);
    textarea.value = value;
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
  }

  async function clickButton(text: string): Promise<void> {
    const button = [...page().querySelectorAll('button')].find(
      (candidate) => candidate.textContent?.trim() === text,
    );
    if (!button) {
      throw new Error(`Button "${text}" not found`);
    }
    button.click();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function errorOf(id: string): string | null {
    return page().querySelector(`#${id}-error`)?.textContent?.trim() ?? null;
  }

  function resultRows(): Element[] {
    return [...page().querySelectorAll('tbody tr')];
  }

  it('renders both labeled editors', () => {
    const labels = [...page().querySelectorAll('label')].map((label) => label.textContent?.trim());
    expect(labels).toEqual(['Baseline response', 'Updated response']);
    expect(editor('baseline-editor').getAttribute('spellcheck')).toBe('false');
    expect(editor('updated-editor').getAttribute('spellcheck')).toBe('false');
  });

  it('shows the initial state before any comparison', () => {
    expect(page().textContent).toContain('Paste two JSON responses and choose Compare');
    expect(page().textContent).not.toContain('No structural differences found');
    expect(page().querySelector('[role="status"]')?.textContent?.trim()).toBe('');
  });

  it('reports empty input for both editors with field-specific messages', async () => {
    await clickButton('Compare');
    expect(errorOf('baseline-editor')).toBe('Paste a JSON response');
    expect(errorOf('updated-editor')).toBe('Paste a JSON response');
    expect(editor('baseline-editor').getAttribute('aria-invalid')).toBe('true');
    expect(editor('updated-editor').getAttribute('aria-invalid')).toBe('true');
    expect(editor('baseline-editor').getAttribute('aria-describedby')).toBe(
      'baseline-editor-error',
    );
    expect(resultRows()).toHaveLength(0);
  });

  it('attributes invalid JSON only to the failing editor', async () => {
    await setEditorValue('baseline-editor', '{"a": 1}');
    await setEditorValue('updated-editor', '{invalid');
    await clickButton('Compare');
    expect(errorOf('baseline-editor')).toBeNull();
    expect(errorOf('updated-editor')).toContain('Invalid JSON');
    expect(editor('baseline-editor').getAttribute('aria-invalid')).toBe('false');
    expect(editor('updated-editor').getAttribute('aria-invalid')).toBe('true');
    expect(page().querySelector('[role="status"]')?.textContent).toContain(
      'Comparison could not run',
    );
  });

  it.each(['baseline-editor', 'updated-editor'])(
    'shows a depth error for %s and recovers after editing the input',
    async (id) => {
      await clickButton('Load example');
      await clickButton('Compare');
      expect(resultRows()).toHaveLength(5);

      await setEditorValue(id, '['.repeat(10_000) + '0' + ']'.repeat(10_000));
      await clickButton('Compare');
      expect(errorOf(id)).toBe(`Invalid JSON: ${JSON_DEPTH_ERROR}`);
      expect(editor(id).getAttribute('aria-invalid')).toBe('true');
      expect(resultRows()).toHaveLength(0);

      await setEditorValue('baseline-editor', '{}');
      await setEditorValue('updated-editor', '{}');
      await clickButton('Compare');
      expect(errorOf(id)).toBeNull();
      expect(page().textContent).toContain('No structural differences found');
    },
  );

  it('compares the loaded example and reports the five expected rows', async () => {
    await clickButton('Load example');
    expect(editor('baseline-editor').value).toContain('Mladen');
    expect(editor('updated-editor').value).toContain('Marko');
    await clickButton('Compare');
    expect(resultRows().length).toBe(5);
    const paths = resultRows().map((row) => row.querySelector('.path')?.textContent?.trim() ?? '');
    expect(paths).toEqual([
      '$.permissions',
      '$.price',
      '$.user.address',
      '$.user.displayName',
      '$.user.name',
    ]);
    expect(page().querySelector('.summary')?.textContent).toContain('5 changes');
    expect(page().querySelector('.summary')?.textContent).toContain('2 added');
    expect(page().querySelector('.summary')?.textContent).toContain('1 removed');
    expect(page().querySelector('.summary')?.textContent).toContain('2 type changed');
    expect(page().querySelector('[role="status"]')?.textContent).toContain(
      'Comparison complete. 5 changes found.',
    );
  });

  it('clears stale results when an input is edited', async () => {
    await clickButton('Load example');
    await clickButton('Compare');
    expect(resultRows().length).toBe(5);
    await setEditorValue('baseline-editor', '{"a": 1}');
    expect(resultRows()).toHaveLength(0);
    expect(page().textContent).toContain('Paste two JSON responses and choose Compare');
  });

  it('clears validation errors when an input is edited', async () => {
    await setEditorValue('updated-editor', '{invalid');
    await clickButton('Compare');
    expect(errorOf('updated-editor')).toContain('Invalid JSON');
    await setEditorValue('updated-editor', '{"a": 2}');
    expect(errorOf('updated-editor')).toBeNull();
    expect(errorOf('baseline-editor')).toBeNull();
  });

  it('resets the page on Clear', async () => {
    await clickButton('Load example');
    await clickButton('Compare');
    await clickButton('Clear');
    expect(editor('baseline-editor').value).toBe('');
    expect(editor('updated-editor').value).toBe('');
    expect(resultRows()).toHaveLength(0);
    expect(errorOf('baseline-editor')).toBeNull();
    expect(errorOf('updated-editor')).toBeNull();
    expect(page().textContent).toContain('Paste two JSON responses and choose Compare');
    expect(page().querySelector('[role="status"]')?.textContent?.trim()).toBe('');
  });

  it('distinguishes zero differences from not having compared yet', async () => {
    expect(page().textContent).toContain('Paste two JSON responses and choose Compare');
    await setEditorValue('baseline-editor', '{"a": 1, "b": [1, 2]}');
    await setEditorValue('updated-editor', '{"b": [3], "a": 99}');
    await clickButton('Compare');
    expect(page().textContent).toContain(
      'No structural differences found. Primitive values and array contents are not compared.',
    );
    expect(page().textContent).not.toContain('Paste two JSON responses and choose Compare');
    expect(page().textContent).toContain(
      'Arrays are compared by type only; their items are not inspected.',
    );
  });
});
