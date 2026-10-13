import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { compareJson, type Difference } from '../compare/compare';
import { parseJson, type ParseResult } from '../compare/json-value';
import { EXAMPLE_BASELINE, EXAMPLE_UPDATED } from '../compare/sample-data';
import { JsonEditor } from '../json-editor/json-editor';
import { Results } from '../results/results';

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

  protected compareResponses(): void {
    const baseline = this.validateSide(this.baselineText());
    const updated = this.validateSide(this.updatedText());
    this.baselineError.set(baseline.ok ? null : baseline.message);
    this.updatedError.set(updated.ok ? null : updated.message);
    if (!baseline.ok || !updated.ok) {
      this.differences.set(null);
      this.statusMessage.set('Comparison could not run. Fix the highlighted JSON and try again.');
      return;
    }
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

  protected loadExample(): void {
    this.baselineText.set(EXAMPLE_BASELINE);
    this.updatedText.set(EXAMPLE_UPDATED);
    this.clearOutput();
  }

  protected clear(): void {
    this.baselineText.set('');
    this.updatedText.set('');
    this.clearOutput();
  }

  protected clearOutput(): void {
    this.baselineError.set(null);
    this.updatedError.set(null);
    this.differences.set(null);
    this.statusMessage.set('');
  }

  private validateSide(text: string): ParseResult {
    if (text.trim() === '') {
      return { ok: false, message: 'Paste a JSON response' };
    }
    const result = parseJson(text);
    return result.ok ? result : { ok: false, message: `Invalid JSON: ${result.message}` };
  }
}
