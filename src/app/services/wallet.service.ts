import {HttpClient, HttpHeaders, HttpParams, HttpResponse} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { VerifiableCredential } from '../interfaces/verifiable-credential';
import { VCReply } from '../interfaces/verifiable-credential-reply';

const headers = new HttpHeaders({
  'Content-Type': 'application/json',
  'Allow-Control-Allow-Origin': '*',
});
const options = {
  headers: headers,
  redirect: 'follow',
};
@Injectable({
  providedIn: 'root',
})
export class WalletService {
  private http = inject(HttpClient);

  public executeContent(url: string): Observable<JSON> {
    return this.http.post<JSON>(
      environment.server_url + environment.server_uri.execute_content_uri,
      { qr_content: url },
      options
    );
  }
  public getVCinCBOR(credential: VerifiableCredential): Observable<string> {
    const options = {
      headers: headers,
      redirect: 'follow',
      responseType: 'text' as const,
    };
    return this.http.post(
      environment.server_url + environment.server_uri.cbor,
      credential,
      options
    );
  }
  public getVCinJWT(credential: VerifiableCredential): Observable<string> {
    const options = {
      headers: headers,
      redirect: 'follow',
      responseType: 'text' as const,
    };
    return this.http.get(
      environment.server_url +
        '/api/credentials/id?credentialId=' +
        credential.id +
        '&format=vc_jwt',
      options
    );
  }

  public requestOpenidCredentialOffer(credentialOfferUri: string): Observable<JSON> {
    const params = new HttpParams().set('credentialOfferUri', credentialOfferUri);
    return this.http.get<JSON>(
      environment.server_url + environment.server_uri.request_credential_uri,
      {
        params,
        headers: options.headers
      }
    );
  }

  // Send the Selected VC List to the WCA to create the Verifiable Presentation
  public executeVC(_VCReply: VCReply): Observable<string> {
    return this.http.post<string>(
      environment.server_url +
        environment.server_uri.verifiable_presentation_uri,
      _VCReply,
      {
        headers: headers,
      }
    );
  }

  // Request all Verifiable Credentials of a user from the Wallet Data
  public getAllVCs(): Observable<VerifiableCredential[]> {
    return this.http.get<VerifiableCredential[]>(
      environment.server_url + environment.server_uri.credentials_uri,
      options
    );
  }

  // Request one Verifiable Credential of a user from the Wallet Data
  public getOne(data: string) {
    return this.http.get<VerifiableCredential>(
      environment.server_url + '/api/vc/1/' + data + '/format?format=vc_json',
      options
    );
  }

  // Deprecated
  // eslint-disable-next-line @typescript-eslint/ban-types
  public submitCredential(arg0: {}) {
    return this.http.post<string>(
      environment.server_url + environment.server_uri.credentials_uri,
      arg0,
      options
    );
  }

  // Delete the selected Verifiable Credential from the Wallet Data
  public deleteVC(VC: string) {
    return this.http.delete<string>(
      environment.server_url +
        environment.server_uri.credentials_by_id_uri +
        VC,
      options
    );
  }
  public requestSignature(credentialId: string): Observable<HttpResponse<string>> {
    const options = {
      observe: 'response' as const,
    };

    return this.http.get<string>(
      `${environment.server_url + environment.server_uri.credentials_signed_by_id_uri}?credentialId=${credentialId}`,
      options
    );
  }

}
