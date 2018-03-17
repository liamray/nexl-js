import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from "@angular/common/http";
import {Observable} from "rxjs/Observable";
import {AuthService} from "./auth.service";
import {Injectable, Injector} from "@angular/core";

@Injectable()
export class AuthHttpInterceptor implements HttpInterceptor {
  constructor(private injector: Injector) {

  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.injector.get(AuthService).getToken();
    let headers = req.headers;
    headers = headers.append('token', token);
    const intercepted = req.clone({
      headers: headers,
      withCredentials: true
    });

    return next.handle(intercepted);
  }
}
