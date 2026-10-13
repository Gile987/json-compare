import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [FormsModule],
  selector: 'app-json-editor',
  styleUrl: './json-editor.scss',
  templateUrl: './json-editor.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonEditor {
  readonly label = input.required<string>();
  readonly editorId = input.required<string>();
  readonly value = model<string>('');
  readonly error = input<string | null>(null);
}
