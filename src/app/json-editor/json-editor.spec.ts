import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { JsonEditor } from './json-editor';

describe('JsonEditor', () => {
  let fixture: ComponentFixture<JsonEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JsonEditor],
    }).compileComponents();
    fixture = TestBed.createComponent(JsonEditor);
    fixture.componentRef.setInput('label', 'Baseline response');
    fixture.componentRef.setInput('editorId', 'baseline-editor');
    fixture.detectChanges();
  });

  function host(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('associates the label with the textarea', () => {
    const label = host().querySelector('label');
    const textarea = host().querySelector('textarea');
    expect(label?.getAttribute('for')).toBe('baseline-editor');
    expect(textarea?.id).toBe('baseline-editor');
    expect(label?.textContent?.trim()).toBe('Baseline response');
  });

  it('shows the error accessibly when present', () => {
    fixture.componentRef.setInput('error', 'Paste a JSON response');
    fixture.detectChanges();
    const textarea = host().querySelector('textarea');
    const error = host().querySelector('#baseline-editor-error');
    expect(error?.textContent?.trim()).toBe('Paste a JSON response');
    expect(textarea?.getAttribute('aria-invalid')).toBe('true');
    expect(textarea?.getAttribute('aria-describedby')).toBe('baseline-editor-error');
  });

  it('omits the error element and aria wiring when there is no error', () => {
    const textarea = host().querySelector('textarea');
    expect(host().querySelector('#baseline-editor-error')).toBeNull();
    expect(textarea?.getAttribute('aria-invalid')).toBe('false');
    expect(textarea?.getAttribute('aria-describedby')).toBeNull();
  });

  it('updates the value model on edit', () => {
    const textarea = host().querySelector('textarea');
    if (!textarea) {
      throw new Error('Textarea not found');
    }
    textarea.value = '{"a": 1}';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(textarea.value).toBe('{"a": 1}');
    expect(fixture.componentInstance.value()).toBe('{"a": 1}');
  });
});
