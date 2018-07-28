import {AfterViewInit, Component, HostListener, ViewChild} from '@angular/core';
import {jqxSplitterComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxsplitter';
import {MESSAGE_TYPE, MessageService} from "../services/message.service";
import {LocalStorageService, MAIN_HORIZONTAL, MAIN_VERTICAL} from "../services/localstorage.service";

const VERTICAL_DEF_VAL = [
  {size: '20%'},
  {size: '80%', collapsible: false}
];

const HORIZONTAL_DEF_VAL = [
  {size: '65%', collapsible: false, min: 100},
  {size: '35%'}
];


@Component({
  selector: '.app-content',
  templateUrl: './content.component.html',
  styleUrls: ['./content.component.css']
})
export class ContentComponent implements AfterViewInit {
  @ViewChild('horizontalSplitter')
  private horizontalSplitter: jqxSplitterComponent;

  @ViewChild('verticalSplitter')
  private verticalSplitter: jqxSplitterComponent;

  constructor(private messageService: MessageService) {
  }

  ngAfterViewInit(): void {
    this.resized();
    this.loadSplitters();
  }

  loadSplitters() {
    this.verticalSplitter.panels(LocalStorageService.loadObj(MAIN_VERTICAL, VERTICAL_DEF_VAL));
    this.horizontalSplitter.panels(LocalStorageService.loadObj(MAIN_HORIZONTAL, HORIZONTAL_DEF_VAL));
  }

  onVerticalResized() {
    this.sendResizeMessage();
    this.saveVertical();
  }

  onHorizontalResized() {
    this.sendResizeMessage();
    this.saveVertical();
  }

  saveHorizontal() {
    LocalStorageService.storeObj(MAIN_HORIZONTAL, this.horizontalSplitter.panels());
  }

  saveVertical() {
    LocalStorageService.storeObj(MAIN_VERTICAL, this.verticalSplitter.panels());
  }

  onHorizontalCollapsed() {
    this.saveHorizontal();
  }

  onHorizontalExpanded() {
    this.saveHorizontal();
  }

  onVerticalCollapsed() {
    this.saveVertical();
  }

  onVerticalExpanded() {
    this.saveVertical();
  }

  private sendResizeMessage() {
    this.messageService.sendMessage(MESSAGE_TYPE.CONTENT_AREA_RESIZED);
  }

  @HostListener('window:resize', ['$event'])
  sizeChange(event) {
    this.resized();
  }

  private resized() {
    this.horizontalSplitter.height(window.innerHeight - 75);
    this.sendResizeMessage();
  }
}
