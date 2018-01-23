import {NgModule} from '@angular/core';
import {HTTP_INTERCEPTORS} from '@angular/common/http';

import {AppComponent} from './app.component';
import {MainModule} from "./main/main.module";
import {AuthHttpInterceptor} from "./services/auth.http.interceptor";

@NgModule({
  declarations: [
    AppComponent
  ],

  imports: [
    MainModule
  ],

  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthHttpInterceptor,
      multi: true
    }

  ],

  bootstrap: [AppComponent]
})
export class AppModule {
}
