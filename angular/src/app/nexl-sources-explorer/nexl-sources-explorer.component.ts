import {Component, ViewChild} from "@angular/core";
import {jqxMenuComponent} from 'jqwidgets-framework/jqwidgets-ts/angular_jqxmenu';
import {jqxTreeComponent} from 'jqwidgets-framework/jqwidgets-ts/angular_jqxtree';

@Component({
	selector: '.app-nexl-sources-explorer',
	templateUrl: './nexl-sources-explorer.component.html',
	styleUrls: ['./nexl-sources-explorer.component.css']
})
export class NexlSourcesExplorerComponent {
	@ViewChild('tree') tree: jqxTreeComponent;
	@ViewChild('popupMenu') popupMenu: jqxMenuComponent;

	treeSource = [
		{
			icon: "/assets/nexl/site/images/dir.png",
			label: "common",
			id: 'common-id',
			expanded: false,
			items: [
				{icon: "/assets/nexl/site/images/js-file.png", label: "interfaces.js"},
				{icon: "/assets/nexl/site/images/js-file.png", label: "commons.js"},
				{icon: "/assets/nexl/site/images/js-file.png", label: "error-messages.js"}
			]
		},

		{
			icon: "/assets/nexl/site/images/dir.png",
			label: "jenkins",
			items: [
				{
					icon: "/assets/nexl/site/images/js-file.png",
					label: "jenkins.js"
				},
				{
					icon: "/assets/nexl/site/images/js-file.png",
					label: "permissions.js"
				}
			]
		},

		{
			icon: "/assets/nexl/site/images/dir.png",
			label: "jvm-opts",
			expanded: false,
			items: [
				{
					icon: "/assets/nexl/site/images/dir.png",
					label: "app-server",
					items: [
						{
							icon: "/assets/nexl/site/images/js-file.png",
							label: "app-server.js"
						}
					]
				},
				{
					icon: "/assets/nexl/site/images/dir.png",
					label: "pearl",
					items: [
						{
							icon: "/assets/nexl/site/images/js-file.png",
							label: "pearl-type1.js"
						},
						{
							icon: "/assets/nexl/site/images/js-file.png",
							label: "pearl-type2.js"
						},
						{
							icon: "/assets/nexl/site/images/js-file.png",
							label: "pearl-type3.js"
						}
					]
				}
			]
		},
		{
			icon: "/assets/nexl/site/images/js-file.png", label: "test.js"
		},
		{
			icon: "/assets/nexl/site/images/general-file.png", label: "Thumbs.db"
		}
	];


	init(): void {
		document.addEventListener('contextmenu', event => {
			event.preventDefault();
			if ((<HTMLElement>event.target).classList.contains('jqx-tree-item')) {
				this.tree.selectItem(event.target);

				let scrollTop = window.scrollY;
				let scrollLeft = window.scrollX;
				this.popupMenu.open(event.clientX + 5 + scrollLeft, event.clientY + 5 + scrollTop);
				return false;
			} else {
				this.popupMenu.close();
			}
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
}