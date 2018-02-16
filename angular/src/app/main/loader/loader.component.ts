import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {jqxLoaderComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxloader";
import {LoaderService} from "../../services/loader.service";

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.css']
})
export class LoaderComponent implements AfterViewInit {
  @ViewChild('loader')
  loader: jqxLoaderComponent;

  constructor(private loaderService: LoaderService) {
  }

  ngAfterViewInit() {
    this.loaderService.loader = this.loader;
  }
}
