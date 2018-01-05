import {Component, ViewChild, OnInit} from "@angular/core";
import {jqxMenuComponent} from 'jqwidgets-framework/jqwidgets-ts/angular_jqxmenu';
import {jqxTreeComponent} from 'jqwidgets-framework/jqwidgets-ts/angular_jqxtree';
import {Http, Response} from "@angular/http";
import * as $ from 'jquery';

interface Value {
	relativePath: string,
	mustLoadChildItems: boolean
}

interface TreeItem {
	label: string,
	value: any,
	id: string
}


@Component({
	selector: '.app-nexl-sources-explorer',
	templateUrl: './nexl-sources-explorer.component.html',
	styleUrls: ['./nexl-sources-explorer.component.css']
})
export class NexlSourcesExplorerComponent implements OnInit {
	@ViewChild('tree') tree: jqxTreeComponent;
	@ViewChild('popupMenu') popupMenu: jqxMenuComponent;

	treeSource = [];

	constructor(private http: Http) {
	}

	ngOnInit() {
		this.http.get('http://localhost:3000/nexl/rest/get-nexl-sources').subscribe(
			(response: Response)=> {
				this.treeSource = response.json();
			},
			(err)=> {
			}
		);
	}

	private openPopup(event) {
		this.tree.selectItem(event.target);

		let scrollTop = window.scrollY;
		let scrollLeft = window.scrollX;
		this.popupMenu.open(event.clientX + 5 + scrollLeft, event.clientY + 5 + scrollTop);
		return false;
	}

	init(): void {
		document.addEventListener('contextmenu', event => {
			event.preventDefault();

			// is to close a popup ?
			if (!(<HTMLElement>event.target).classList.contains('jqx-tree-item')) {
				this.popupMenu.close();
				return;
			}

			return this.openPopup(event);
		});

	}

	onPopup(event: any): void {
		let item = event.args.innerText;
		let selectedItem = null;
		switch (item) {
			case "Add Item":
				selectedItem = this.tree.getSelectedItem();
				if (selectedItem != null) {
					this.tree.addTo({label: 'Item'}, selectedItem.element);
				}
				break;
			case "Remove Item":
				selectedItem = this.tree.getSelectedItem();
				if (selectedItem != null) {
					this.tree.removeItem(selectedItem.element);
				}
				break;
		}
	};

	select(event: any) {
		console.log(event);
	}

	expand(event: any) {
		var element: TreeItem = <TreeItem>this.tree.getItem(event.args.element);
		var value: Value = <Value>element.value;
		if (!value.mustLoadChildItems) {
			return;
		}
		value.mustLoadChildItems = false;
		var $element = $(event.args.element);
		var child = $element.find('ul:first').children()[0];
		this.tree.removeItem(child);
		this.http.get('http://localhost:3000/nexl/rest/get-nexl-sources', {params: {relativePath: value.relativePath}}).subscribe(
			(response: Response)=> {
				this.tree.addTo(response.json(), event.args.element);
			},
			(err)=> {
			}
		);
	}
}