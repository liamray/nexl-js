import {NgModule} from '@angular/core';
import {HTTP_INTERCEPTORS} from '@angular/common/http';

import {AppComponent} from './app.component';
import {MainModule} from "./main/main.module";

@NgModule({
  declarations: [
    AppComponent
  ],

  imports: [
    MainModule
  ],

  bootstrap: [AppComponent]
})
export class AppModule {
}
