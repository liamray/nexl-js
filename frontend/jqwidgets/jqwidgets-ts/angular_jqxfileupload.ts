/*
jQWidgets v5.7.2 (2018-Apr)
Copyright (c) 2011-2018 jQWidgets.
License: https://jqwidgets.com/license/
*/
/// <reference path="jqwidgets.d.ts" />
import '../jqwidgets/jqxcore.js';
import '../jqwidgets/jqxbuttons.js';
import '../jqwidgets/jqxfileupload.js';
import { Component, Input, Output, EventEmitter, ElementRef, OnChanges, SimpleChanges } from '@angular/core';
declare let JQXLite: any;

@Component({
    selector: 'jqxFileUpload',
    template: '<div><ng-content></ng-content></div>'
})

export class jqxFileUploadComponent implements OnChanges
{
   @Input('autoUpload') attrAutoUpload: boolean;
   @Input('accept') attrAccept: string;
   @Input('browseTemplate') attrBrowseTemplate: any;
   @Input('cancelTemplate') attrCancelTemplate: any;
   @Input('disabled') attrDisabled: boolean;
   @Input('fileInputName') attrFileInputName: string;
   @Input('localization') attrLocalization: jqwidgets.FileUploadLocalization;
   @Input('multipleFilesUpload') attrMultipleFilesUpload: boolean;
   @Input('renderFiles') attrRenderFiles: (filename:any) => void;
   @Input('rtl') attrRtl: boolean;
   @Input('theme') attrTheme: string;
   @Input('uploadUrl') attrUploadUrl: string;
   @Input('uploadTemplate') attrUploadTemplate: any;
   @Input('width') attrWidth: string | number;
   @Input('height') attrHeight: string | number;

   @Input('auto-create') autoCreate: boolean = true;

   properties: string[] = ['autoUpload','accept','browseTemplate','cancelTemplate','disabled','fileInputName','height','localization','multipleFilesUpload','renderFiles','rtl','theme','uploadUrl','uploadTemplate','width'];
   host: any;
   elementRef: ElementRef;
   widgetObject:  jqwidgets.jqxFileUpload;

   constructor(containerElement: ElementRef) {
      this.elementRef = containerElement;
   }

   ngOnInit() {
      if (this.autoCreate) {
         this.createComponent(); 
      }
   }; 

   ngOnChanges(changes: SimpleChanges) {
      if (this.host) {
         for (let i = 0; i < this.properties.length; i++) {
            let attrName = 'attr' + this.properties[i].substring(0, 1).toUpperCase() + this.properties[i].substring(1);
            let areEqual: boolean = false;

            if (this[attrName] !== undefined) {
               if (typeof this[attrName] === 'object') {
                  if (this[attrName] instanceof Array) {
                     areEqual = this.arraysEqual(this[attrName], this.host.jqxFileUpload(this.properties[i]));
                  }
                  if (areEqual) {
                     return false;
                  }

                  this.host.jqxFileUpload(this.properties[i], this[attrName]);
                  continue;
               }

               if (this[attrName] !== this.host.jqxFileUpload(this.properties[i])) {
                  this.host.jqxFileUpload(this.properties[i], this[attrName]); 
               }
            }
         }
      }
   }

   arraysEqual(attrValue: any, hostValue: any): boolean {
      if ((attrValue && !hostValue) || (!attrValue && hostValue)) {
         return false;
      }
      if (attrValue.length != hostValue.length) {
         return false;
      }
      for (let i = 0; i < attrValue.length; i++) {
         if (attrValue[i] !== hostValue[i]) {
            return false;
         }
      }
      return true;
   }

   manageAttributes(): any {
      let options = {};
      for (let i = 0; i < this.properties.length; i++) {
         let attrName = 'attr' + this.properties[i].substring(0, 1).toUpperCase() + this.properties[i].substring(1);
         if (this[attrName] !== undefined) {
            options[this.properties[i]] = this[attrName];
         }
      }
      return options;
   }

   moveClasses(parentEl: HTMLElement, childEl: HTMLElement): void {
      let classes: any = parentEl.classList;
      if (classes.length > 0) {
        childEl.classList.add(...classes);
      }
      parentEl.className = '';
   }

   moveStyles(parentEl: HTMLElement, childEl: HTMLElement): void {
      let style = parentEl.style.cssText;
      childEl.style.cssText = style
      parentEl.style.cssText = '';
   }

   createComponent(options?: any): void {
      if (options) {
         JQXLite.extend(options, this.manageAttributes());
      }
      else {
        options = this.manageAttributes();
      }
      this.host = JQXLite(this.elementRef.nativeElement.firstChild);

      this.moveClasses(this.elementRef.nativeElement, this.host[0]);
      this.moveStyles(this.elementRef.nativeElement, this.host[0]);

      this.__wireEvents__();
      this.widgetObject = jqwidgets.createInstance(this.host, 'jqxFileUpload', options);

      this.__updateRect__();
   }

   createWidget(options?: any): void {
        this.createComponent(options);
   }

   __updateRect__() : void {
      this.host.css({ width: this.attrWidth, height: this.attrHeight });
   }

   setOptions(options: any) : void {
      this.host.jqxFileUpload('setOptions', options);
   }

   // jqxFileUploadComponent properties
   autoUpload(arg?: boolean) : any {
      if (arg !== undefined) {
          this.host.jqxFileUpload('autoUpload', arg);
      } else {
          return this.host.jqxFileUpload('autoUpload');
      }
   }

   accept(arg?: string) : any {
      if (arg !== undefined) {
          this.host.jqxFileUpload('accept', arg);
      } else {
          return this.host.jqxFileUpload('accept');
      }
   }

   browseTemplate(arg?: string) : any {
      if (arg !== undefined) {
          this.host.jqxFileUpload('browseTemplate', arg);
      } else {
          return this.host.jqxFileUpload('browseTemplate');
      }
   }

   cancelTemplate(arg?: string) : any {
      if (arg !== undefined) {
          this.host.jqxFileUpload('cancelTemplate', arg);
      } else {
          return this.host.jqxFileUpload('cancelTemplate');
      }
   }

   disabled(arg?: boolean) : any {
      if (arg !== undefined) {
          this.host.jqxFileUpload('disabled', arg);
      } else {
          return this.host.jqxFileUpload('disabled');
      }
   }

   fileInputName(arg?: string) : any {
      if (arg !== undefined) {
          this.host.jqxFileUpload('fileInputName', arg);
      } else {
          return this.host.jqxFileUpload('fileInputName');
      }
   }

   height(arg?: number | string) : any {
      if (arg !== undefined) {
          this.host.jqxFileUpload('height', arg);
      } else {
          return this.host.jqxFileUpload('height');
      }
   }

   localization(arg?: jqwidgets.FileUploadLocalization) : any {
      if (arg !== undefined) {
          this.host.jqxFileUpload('localization', arg);
      } else {
          return this.host.jqxFileUpload('localization');
      }
   }

   multipleFilesUpload(arg?: boolean) : any {
      if (arg !== undefined) {
          this.host.jqxFileUpload('multipleFilesUpload', arg);
      } else {
          return this.host.jqxFileUpload('multipleFilesUpload');
      }
   }

   renderFiles(arg?: (filename:any) => void) : any {
      if (arg !== undefined) {
          this.host.jqxFileUpload('renderFiles', arg);
      } else {
          return this.host.jqxFileUpload('renderFiles');
      }
   }

   rtl(arg?: boolean) : any {
      if (arg !== undefined) {
          this.host.jqxFileUpload('rtl', arg);
      } else {
          return this.host.jqxFileUpload('rtl');
      }
   }

   theme(arg?: string) : any {
      if (arg !== undefined) {
          this.host.jqxFileUpload('theme', arg);
      } else {
          return this.host.jqxFileUpload('theme');
      }
   }

   uploadUrl(arg?: string) : any {
      if (arg !== undefined) {
          this.host.jqxFileUpload('uploadUrl', arg);
      } else {
          return this.host.jqxFileUpload('uploadUrl');
      }
   }

   uploadTemplate(arg?: string) : any {
      if (arg !== undefined) {
          this.host.jqxFileUpload('uploadTemplate', arg);
      } else {
          return this.host.jqxFileUpload('uploadTemplate');
      }
   }

   width(arg?: string | number) : any {
      if (arg !== undefined) {
          this.host.jqxFileUpload('width', arg);
      } else {
          return this.host.jqxFileUpload('width');
      }
   }


   // jqxFileUploadComponent functions
   browse(): void {
      this.host.jqxFileUpload('browse');
   }

   cancelFile(fileIndex: number): void {
      this.host.jqxFileUpload('cancelFile', fileIndex);
   }

   cancelAll(): void {
      this.host.jqxFileUpload('cancelAll');
   }

   destroy(): void {
      this.host.jqxFileUpload('destroy');
   }

   render(): void {
      this.host.jqxFileUpload('render');
   }

   refresh(): void {
      this.host.jqxFileUpload('refresh');
   }

   uploadFile(fileIndex: number): void {
      this.host.jqxFileUpload('uploadFile', fileIndex);
   }

   uploadAll(): void {
      this.host.jqxFileUpload('uploadAll');
   }


   // jqxFileUploadComponent events
   @Output() onRemove = new EventEmitter();
   @Output() onSelect = new EventEmitter();
   @Output() onUploadStart = new EventEmitter();
   @Output() onUploadEnd = new EventEmitter();

   __wireEvents__(): void {
      this.host.on('remove', (eventData: any) => { this.onRemove.emit(eventData); });
      this.host.on('select', (eventData: any) => { this.onSelect.emit(eventData); });
      this.host.on('uploadStart', (eventData: any) => { this.onUploadStart.emit(eventData); });
      this.host.on('uploadEnd', (eventData: any) => { this.onUploadEnd.emit(eventData); });
   }

} //jqxFileUploadComponent


