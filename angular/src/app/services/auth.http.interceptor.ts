import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from "@angular/common/http";
import {Observable} from "rxjs/Observable";
import {AuthService} from "./auth.service";
import {Injectable, Injector} from "@angular/core";

@Injectable()
export class AuthHttpInterceptor implements HttpInterceptor {
  constructor(private injector: Injector) {

  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const credentials = this.injector.get(AuthService).credentials;
    const token = credentials && credentials.token;

    var headers = token ? {headers: req.headers.set('token', token)} : {};
    const intercepted = req.clone(headers);

    return next.handle(intercepted);
  }
}
