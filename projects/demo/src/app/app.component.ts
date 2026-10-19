import { Component, ViewEncapsulation } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TRANSLATE_IMPORTS } from 'src/_translate.imports';
@Component({
  standalone: true,
  imports: [TRANSLATE_IMPORTS, ReactiveFormsModule, RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent {
  nameInput = new FormControl('');
  constructor() {
  }

}
