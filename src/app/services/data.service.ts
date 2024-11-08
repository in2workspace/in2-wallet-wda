import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private didSubject = new BehaviorSubject<string|undefined>(undefined);

  public constructor(private http: HttpClient) {}

  public listenDid(): BehaviorSubject<string|undefined> {
    return this.didSubject;
  }

  public getDid() {
    return this.http
      .get(environment.server_url + environment.server_uri.ebsi_did_uri, {
        responseType: 'text',
      })
      .pipe(
        map((didResponse) => {
          this.didSubject.next(didResponse);
        }),
        catchError(() => {
          throw new Error('Err');
        })
      );
  }
}
