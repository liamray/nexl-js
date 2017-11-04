import {HostListener, Component, AfterViewInit, ViewChild} from '@angular/core';
import {jqxSplitterComponent} from 'jqwidgets-framework/jqwidgets-ts/angular_jqxsplitter';


@Component({
	selector: '.app-content',
	templateUrl: './content.component.html',
	styleUrls: ['./content.component.css']
})
export class ContentComponent implements AfterViewInit {
	@ViewChild('outerSplitter')
	private outerSplitter: jqxSplitterComponent;

	ngAfterViewInit(): void {
		this.resized();
	}

	private resized() {
		this.outerSplitter.height(window.innerHeight - 75);
	}

	@HostListener('window:resize', ['$event'])
	sizeChange(event) {
		this.resized();
	}
}