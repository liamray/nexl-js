import {AfterViewInit, Component, ComponentFactoryResolver, ViewChild, ViewContainerRef} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import {BindingsComponent} from "./bindings/bindings.component";
import {GeneralComponent} from "./general/general.component";
import {LoggerComponent} from "./logger/logger.component";
import {CallbacksComponent} from "./callbacks/callbacks.component";
import {UiComponent} from "./ui/ui.component";

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent {
  @ViewChild('settingsWindow')
  settingsWindow: jqxWindowComponent;

  @ViewChild('general', {read: ViewContainerRef})
  generalRef;

  @ViewChild('bindings', {read: ViewContainerRef})
  bindingsRef;

  @ViewChild('logger', {read: ViewContainerRef})
  loggerRef;

  @ViewChild('callbacks', {read: ViewContainerRef})
  callbacksRef;

  @ViewChild('ui', {read: ViewContainerRef})
  uiRef;

  general: any;
  bindings: BindingsComponent;
  logger: LoggerComponent;
  callbacks: CallbacksComponent;
  ui: UiComponent;

  @ViewChild('saveButton')
  saveButton: jqxButtonComponent;

  @ViewChild('cancelButton')
  cancelButton: jqxButtonComponent;

  constructor(private componentFactoryResolver: ComponentFactoryResolver) {
  }

  open() {
    this.settingsWindow.open();
  }

  save() {
    const any = this.bindings.validate();
    console.log(any);
  }

  initContent = () => {
    jqwidgets.createInstance('#ribbon', 'jqxRibbon', {
      width: 600,
      height: 400,
      position: 'left',
      selectionMode: 'click',
      animationType: 'none'
    });
    this.saveButton.createComponent();
    this.cancelButton.createComponent();
    this.general.instance.createButtons();

  };

  ngOnInit() {
    this.general = this.generalRef.createComponent(this.componentFactoryResolver.resolveComponentFactory(GeneralComponent));
    this.bindings = this.bindingsRef.createComponent(this.componentFactoryResolver.resolveComponentFactory(BindingsComponent));
    this.logger = this.loggerRef.createComponent(this.componentFactoryResolver.resolveComponentFactory(LoggerComponent));
    this.callbacks = this.callbacksRef.createComponent(this.componentFactoryResolver.resolveComponentFactory(CallbacksComponent));
    this.ui = this.uiRef.createComponent(this.componentFactoryResolver.resolveComponentFactory(UiComponent));

  }
}
