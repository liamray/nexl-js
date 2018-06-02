import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {jqxLoaderComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxloader";
import {GlobalComponentsService} from "../../../services/global-components.service";

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.css']
})
export class LoaderComponent implements AfterViewInit {
  @ViewChild('loader')
  loader: jqxLoaderComponent;

  constructor(private globalComponentsService: GlobalComponentsService) {
  }

  ngAfterViewInit() {
    this.globalComponentsService.loader = this.loader;
  }
}
