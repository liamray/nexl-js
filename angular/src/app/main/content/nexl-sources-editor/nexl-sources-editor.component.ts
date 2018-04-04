import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {jqxTabsComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxtabs";
import {HttpRequestService} from "../../../services/http.requests.service";

@Component({
  selector: '.app-nexl-sources-editor',
  templateUrl: './nexl-sources-editor.component.html',
  styleUrls: ['./nexl-sources-editor.component.css'],
})
export class NexlSourcesEditorComponent implements AfterViewInit {
  @ViewChild('nexlSourcesTabs') nexlSourcesTabs: jqxTabsComponent;

  id = 0;

  constructor(private http: HttpRequestService) {
  }

  ngAfterViewInit(): void {
    this.nexlSourcesTabs.scrollPosition('both');
    this.nexlSourcesTabs.removeFirst();

    this.http.post({relativePath: '/examples.js'}, '/sources/get-source-content', 'text').subscribe(
      (content: any) => {
        const newId = 'tabs' + this.id++;
        this.nexlSourcesTabs.addAt(0, 'Dynamic tab', '<div id="' + newId + '" style="width:100%; height:100%;">' + content.body + '</div>');
        ace.edit(newId);
      },
      (err) => {
        alert(err.statusText);
      }
    );

  }
}
