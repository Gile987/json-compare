import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DriftDetector } from './drift-detector/drift-detector';

@Component({
  imports: [DriftDetector],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
