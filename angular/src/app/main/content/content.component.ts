import {AfterViewInit, Component, HostListener, ViewChild} from '@angular/core';
import {jqxSplitterComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxsplitter';
import {MESSAGE_TYPE, MessageService} from "../../services/message.service";

@Component({
	selector: '.app-content',
	templateUrl: './content.component.html',
	styleUrls: ['./content.component.css']
})
export class ContentComponent implements AfterViewInit {
	@ViewChild('outerSplitter')
	private outerSplitter: jqxSplitterComponent;

  constructor(private messageService: MessageService) {

  }

	ngAfterViewInit(): void {
		this.resized();
	}

  onResize() {
    this.sendResizeMessage();
  }

  private sendResizeMessage() {
    this.messageService.sendMessage({
      type: MESSAGE_TYPE.CONTENT_AREA_RESIZED
    });
  }

	@HostListener('window:resize', ['$event'])
	sizeChange(event) {
		this.resized();
	}

  private resized() {
    this.outerSplitter.height(window.innerHeight - 75);
    this.sendResizeMessage();
  }
}
