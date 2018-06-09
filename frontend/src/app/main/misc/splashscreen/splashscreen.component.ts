import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import jqxCheckBox = jqwidgets.jqxCheckBox;
import {jqxCheckBoxComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxcheckbox";
import {LocalStorageService, SHOW_SPLASH_SCREEN} from "../../services/localstorage.service";

@Component({
  selector: 'app-splashscreen',
  templateUrl: './splashscreen.component.html',
  styleUrls: ['./splashscreen.component.css']
})
export class SplashscreenComponent implements AfterViewInit {
  @ViewChild('splash') splash: jqxWindowComponent;
  @ViewChild('okButton') okButton: jqxButtonComponent;
  @ViewChild('checkBox') checkBox: jqxCheckBoxComponent;

  isShowSplashScreen: boolean = false;

  constructor() {
    let showSplashScreen = LocalStorageService.loadRaw(SHOW_SPLASH_SCREEN) || true;
    this.isShowSplashScreen = showSplashScreen.toString() === true.toString();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.splash.close();
    }, 500);
  }

  onChecked() {
    LocalStorageService.storeRaw(SHOW_SPLASH_SCREEN, !this.checkBox.val())
  }
}
