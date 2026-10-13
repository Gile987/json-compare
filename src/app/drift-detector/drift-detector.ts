import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { compareJson, Difference } from '../compare/compare';
import { JsonValue, parseJson } from '../compare/json-value';
import { EXAMPLE_BASELINE, EXAMPLE_UPDATED } from '../compare/sample-data';
import { JsonEditor } from '../json-editor/json-editor';
import { Results } from '../results/results';

type SideValidation = { value: JsonValue } | { error: string };

@Component({
  imports: [JsonEditor, Results],
  selector: 'app-drift-detector',
  styleUrl: './drift-detector.scss',
  templateUrl: './drift-detector.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriftDetector {
  protected readonly baselineText = signal('');
  protected readonly updatedText = signal('');
  protected readonly baselineError = signal<string | null>(null);
  protected readonly updatedError = signal<string | null>(null);
  protected readonly differences = signal<readonly Difference[] | null>(null);
  protected readonly statusMessage = signal('');

  protected onCompare(): void {
    const baseline = this.validateSide(this.baselineText());
    const updated = this.validateSide(this.updatedText());
    if ('error' in baseline || 'error' in updated) {
      this.baselineError.set('error' in baseline ? baseline.error : null);
      this.updatedError.set('error' in updated ? updated.error : null);
      this.differences.set(null);
      this.statusMessage.set('Comparison could not run. Fix the highlighted JSON and try again.');
      return;
    }
    this.baselineError.set(null);
    this.updatedError.set(null);
    const differences = compareJson(baseline.value, updated.value);
    this.differences.set(differences);
    this.statusMessage.set(
      differences.length === 0
        ? 'Comparison complete. No structural differences found.'
        : `Comparison complete. ${differences.length} ${
            differences.length === 1 ? 'change' : 'changes'
          } found.`,
    );
  }

  protected onLoadExample(): void {
    this.baselineText.set(EXAMPLE_BASELINE);
    this.updatedText.set(EXAMPLE_UPDATED);
    this.clearOutput();
  }

  protected onClear(): void {
    this.baselineText.set('');
    this.updatedText.set('');
    this.clearOutput();
  }

  protected onEdited(): void {
    this.clearOutput();
  }

  private clearOutput(): void {
    this.baselineError.set(null);
    this.updatedError.set(null);
    this.differences.set(null);
    this.statusMessage.set('');
  }

  private validateSide(text: string): SideValidation {
    if (text.trim() === '') {
      return { error: 'Paste a JSON response' };
    }
    const result = parseJson(text);
    return result.ok ? { value: result.value } : { error: `Invalid JSON: ${result.message}` };
  }
}
