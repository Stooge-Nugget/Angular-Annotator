import { Component } from '@angular/core';
import { highlightModel } from './annotation.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  public pdfSrc;
  public annotations: any[];

  private demoSelection;

  constructor() {}

  handleSelectedText(event: highlightModel) {
    if (!!event.highlightedText) {
      this.demoSelection = [event];
    }
  }

  loadAnnotations() {
    this.annotations = this.demoSelection;
  }

  onFileSelected() {
    const file: any = document.querySelector('#file');

    if (typeof (FileReader) !== 'undefined') {
      let reader = new FileReader();

      reader.onload = (e: any) => {
        this.pdfSrc = e.target.result;
      };

      reader.readAsArrayBuffer(file.files[0]);
    }
  }
}
