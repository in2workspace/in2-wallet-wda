import {ComponentFixture, fakeAsync, TestBed, tick, waitForAsync} from '@angular/core/testing';
import {AlertController, IonicModule} from '@ionic/angular';
import {TranslateModule} from '@ngx-translate/core';
import {RouterTestingModule} from '@angular/router/testing';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {of, Subject, throwError} from 'rxjs';
import {CredentialsPage} from './credentials.page';
import {WalletService} from 'src/app/services/wallet.service';
import {WebsocketService} from 'src/app/services/websocket.service';
import {DataService} from 'src/app/services/data.service';
import {AuthenticationService} from 'src/app/services/authentication.service';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {CredentialStatus, VerifiableCredential} from 'src/app/interfaces/verifiable-credential';
import {Storage} from '@ionic/storage-angular';

class MockRouter {
  public events = new Subject<any>();
  public navigate = (route:string|string[], opt?:{})=>'';
}

const writeText = jest.fn()
Object.assign(navigator, {
  clipboard: {
    writeText,
  },
});

describe('CredentialsPage', () => {
  let component: CredentialsPage;
  let fixture: ComponentFixture<CredentialsPage>;
  let walletServiceSpy: jest.Mocked<WalletService>;
  let websocketServiceSpy: jest.Mocked<WebsocketService>;
  let httpTestingController: HttpTestingController;
  let mockRouter: MockRouter;

  const TIME_IN_MS = 10000;

  beforeEach(waitForAsync(() => {

    walletServiceSpy = {
      getAllVCs: jest.fn().mockReturnValue(of([])),
      requestOpenidCredentialOffer: jest.fn().mockReturnValue(of({} as any)),
      deleteVC: jest.fn(),
      executeContent: jest.fn().mockReturnValue(of({} as any))
    } as unknown as jest.Mocked<WalletService>;

    websocketServiceSpy = {
      connect: jest.fn(),
      closeConnection: jest.fn()
    } as unknown as jest.Mocked<WebsocketService>;

    const dataServiceSpyObj = {
      listenDid: jest.fn().mockReturnValue(of('someDidValue'))
    } as unknown as jest.Mocked<DataService>;

    const authServiceSpyObj = {
      getName: jest.fn()
    } as unknown as jest.Mocked<AuthenticationService>;

    mockRouter = new MockRouter();

    TestBed.configureTestingModule({
      imports: [
        IonicModule.forRoot(),
        TranslateModule.forRoot(),
        RouterTestingModule,
        HttpClientTestingModule
      ],
      providers: [
        Storage,
        { provide: Router, useValue: mockRouter},
        { provide: WalletService, useValue: walletServiceSpy },
        { provide: WebsocketService, useValue: websocketServiceSpy },
        { provide: DataService, useValue: dataServiceSpyObj },
        { provide: AuthenticationService, useValue: authServiceSpyObj },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({ credentialOfferUri: 'mockCredentialOfferUri' }),
            snapshot: {
              routeConfig: {
                path: 'credentials'
              }
            }
          },
        },
      ],
    }).compileComponents();

    httpTestingController = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CredentialsPage);
    component = fixture.componentInstance;
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should enable scan mode when scan is called', () => {
    component.scan();
    expect(component.toggleScan).toBe(true);
    expect(component.show_qr).toBe(true);
    expect(component.ebsiFlag).toBe(false);
  });

  // it('should copy "did-text" to clipboard when copyToClipboard is called with "did-text"', async () => {
  //  jest.spyOn(navigator.clipboard, 'writeText');

  //   const didText = 'DID: exampleDid';
  //   const expectedClipboardContent = 'exampleDid';
  //   document.body.innerHTML = `<div id="did-text">${didText}</div>`;

  //   await component.copyToClipboard('did-text');

  //   expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expectedClipboardContent);
  // });

  // it('should handle error gracefully if clipboard API fails', async () => {
  //  jest.spyOn(navigator.clipboard, 'writeText').and.rejectWith('Test error');
  //  jest.spyOn(console, 'error');

  //   const didTextContent = 'DID: exampleDid';
  //   document.body.innerHTML = `<div id="did-text">${didTextContent}</div>`;

  //   await component.copyToClipboard('did-text');

  //   expect(console.error).toHaveBeenCalledWith('Error al copiar texto al portapapeles:', 'Test error');
  // });

  it('should generate credential after websocket connection', fakeAsync(() => {
    const mockCredentialOfferUri = 'mockCredentialOfferUri';

    component.credentialOfferUri = mockCredentialOfferUri;
    component.generateCred();

    // Avanzar el tiempo para simular el retraso en la conexión del WebSocket
    tick(4000);

    expect(walletServiceSpy.requestOpenidCredentialOffer).toHaveBeenCalledWith(mockCredentialOfferUri);
    expect(websocketServiceSpy.connect).toHaveBeenCalled();
  }));

  it('should update the credential list when refresh is called', fakeAsync(() => {
    const mockCredList: VerifiableCredential[] = [
      {
        "@context": ["https://www.w3.org/ns/credentials/v2"],
        "id": "1",
        "type": ["VerifiableCredential", "SomeType"],
        "issuer": {
          "id": "issuerId1"
        },
        "issuanceDate": "2021-01-01T00:00:00Z",
        "validFrom": "2021-01-01T00:00:00Z",
        "expirationDate": "2025-12-31T23:59:59Z",
        "validUntil": "2025-12-31T23:59:59Z",
        "credentialSubject": {
          "mandate": {
            "id": "mandateId1",
            "mandator": {
              "organizationIdentifier": "orgId1",
              "commonName": "Common Name",
              "emailAddress": "email@example.com",
              "serialNumber": "serialNumber1",
              "organization": "Organization Name",
              "country": "Country"
            },
            "mandatee": {
              "id": "personId1",
              "first_name": "First",
              "last_name": "Last",
              "gender": "Gender",
              "email": "email@example.com",
              "mobile_phone": "+1234567890"
            },
            "power": [
              {
                "id": "powerId1",
                "tmf_type": "Domain",
                "tmf_domain": ["SomeDomain"],
                "tmf_function": "SomeFunction",
                "tmf_action": ["SomeAction"]
              }
            ],
            "life_span": {
              "start_date_time": "2021-01-01T00:00:00Z",
              "end_date_time": "2025-12-31T23:59:59Z"
            }
          }
        },
        status: CredentialStatus.ISSUED
      }
    ];

    walletServiceSpy.getAllVCs.mockReturnValue(of(mockCredList));

    component.refresh();
    tick();

    expect(component.credList).toEqual(mockCredList.reverse());
  }));


  it('vcDelete should call deleteVC on the wallet service with the correct ID and refresh the list', () => {
    const testCredential: VerifiableCredential = {
      "@context": ["https://www.w3.org/ns/credentials/v2"],
      "id": "testCredentialId",
      "type": ["VerifiableCredential", "SomeType"],
      "issuer": {
        "id": "issuerId1"
      },
      "issuanceDate": "2024-04-02T09:23:22.637345122Z",
      "validFrom": "2024-04-02T09:23:22.637345122Z",
      "expirationDate": "2025-04-02T09:23:22.637345122Z",
      "validUntil": "2025-04-02T09:23:22.637345122Z",
      "credentialSubject": {
        "mandate": {
          "id": "mandateId1",
          "mandator": {
            "organizationIdentifier": "orgId1",
            "commonName": "Common Name",
            "emailAddress": "email@example.com",
            "serialNumber": "serialNumber1",
            "organization": "Organization Name",
            "country": "Country"
          },
          "mandatee": {
            "id": "personId1",
            "first_name": "First",
            "last_name": "Last",
            "gender": "Gender",
            "email": "email@example.com",
            "mobile_phone": "+1234567890"
          },
          "power": [
            {
              "id": "powerId1",
              "tmf_type": "Domain",
              "tmf_domain": ["SomeDomain"],
              "tmf_function": "SomeFunction",
              "tmf_action": ["SomeAction"]
            }
          ],
          "life_span": {
            "start_date_time": "2024-04-02T09:23:22.637345122Z",
            "end_date_time": "2025-04-02T09:23:22.637345122Z"
          }
        }
      },
      status: CredentialStatus.ISSUED
    };

    walletServiceSpy.deleteVC.mockReturnValue(of('Success'));
    jest.spyOn(component, 'refresh');
    component.vcDelete(testCredential);
    expect(walletServiceSpy.deleteVC).toHaveBeenCalledWith(testCredential.id);
    expect(component.refresh).toHaveBeenCalled();
  });

  it('ngOnInit should initialize component properties and call refresh', () => {
    walletServiceSpy.getAllVCs.mockReturnValue(of([]));
    jest.spyOn(component, 'refresh');
    component.ngOnInit();
    expect(component.scaned_cred).toBe(false);
    expect(component.refresh).toHaveBeenCalled();
  });

  it('qrCodeEmit should process QR code after websocket connection', fakeAsync(() => {
    jest.spyOn(mockRouter, 'navigate');
    const testQrCode = "someTestQrCode";

    // Simulamos la conexión del WebSocket.
    component.qrCodeEmit(testQrCode);

    // Avanzar el tiempo para simular el retraso.
    tick(1000);

    // Ahora comprobamos que el contenido se ejecutó después de la conexión.
    expect(walletServiceSpy.executeContent).toHaveBeenCalledWith(testQrCode);
    expect(websocketServiceSpy.connect).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/tabs/vc-selector/'], { queryParams: { executionResponse: JSON.stringify({}) } });
  }));


  it('should handle alert Cancel correctly', fakeAsync(() => {
    const alertController = TestBed.inject(AlertController);
    jest.spyOn(alertController, 'create').mockResolvedValue({
      present: () => Promise.resolve(),
      buttons: [
        { text: 'Cancelar', role: 'cancel', handler: () => {} },
        { text: 'Aceptar', handler: () => {} }
      ]
    } as any);

    component.credentialClick();
    tick();
  }));

  it('should handle alert Accept correctly', fakeAsync(() => {
    const alertController = TestBed.inject(AlertController);
    jest.spyOn(alertController, 'create').mockResolvedValue({
      present: () => Promise.resolve(),
      buttons: [
        { text: 'Cancelar', role: 'cancel', handler: () => {} },
        { text: 'Aceptar', handler: () => {} }
      ]
    } as any);

    component.credentialClick();
    tick();
  }));


  it('should untoggle scan and call detectChanges when navigation is outside /tabs/credentials', fakeAsync(() => {
    const mockNavigationEndEvent = new NavigationEnd(42, '/tabs/credentials', '/new-url/tabs/other-section');
    walletServiceSpy.getAllVCs.mockReturnValue(of([]));

    const untoggleScanSpy = jest.spyOn(component, 'untoggleScan');
    const detectChangesSpy = jest.spyOn(component['cdr'], 'detectChanges');

    mockRouter.events.next(mockNavigationEndEvent);

    expect(untoggleScanSpy).toHaveBeenCalled();
    expect(detectChangesSpy).toHaveBeenCalled();
  }));

  it('should not untoggle scan if the destination starts with /tabs/credentials', fakeAsync(() => {
    const mockNavigationEndEvent = new NavigationEnd(42, '/tabs/credentials', '/tabs/credentials/some-subroute');
    walletServiceSpy.getAllVCs.mockReturnValue(of([]));
    const untoggleScanSpy = jest.spyOn(component, 'untoggleScan');
    const detectChangesSpy = jest.spyOn(component['cdr'], 'detectChanges');

    jest.spyOn(mockRouter.events, 'pipe').mockReturnValue(of(mockNavigationEndEvent));

    expect(untoggleScanSpy).not.toHaveBeenCalled();
    expect(detectChangesSpy).not.toHaveBeenCalled();
  }));

  it('should close websocket connection after credential request', fakeAsync(() => {
    component.credentialOfferUri = 'mockCredentialOfferUri';
    component.generateCred();

    // Simulamos el retraso para que se complete la conexión y solicitud
    tick(4000);

    expect(walletServiceSpy.requestOpenidCredentialOffer).toHaveBeenCalled();
    expect(websocketServiceSpy.closeConnection).toHaveBeenCalled();
  }));

  it('should close websocket connection if an error occurs', fakeAsync(() => {
    jest.spyOn(walletServiceSpy, 'requestOpenidCredentialOffer').mockReturnValueOnce(throwError(() => new Error('Test error')));

    component.credentialOfferUri = 'mockCredentialOfferUri';
    component.generateCred();

    // Simulamos el retraso para que se complete la conexión y solicitud
    tick(1000);

    expect(walletServiceSpy.requestOpenidCredentialOffer).toHaveBeenCalled();
    expect(websocketServiceSpy.closeConnection).toHaveBeenCalled();
  }));


  it('should log error to cameraLogsService when executeContent fails', fakeAsync(() => {
    const mockErrorResponse = {
      error: {
        title: 'Test Error Title',
        message: 'Test Error Message',
        path: '/test/error/path'
      }
    };
    const errorMessage = `${mockErrorResponse.error.title} . ${mockErrorResponse.error.message} . ${mockErrorResponse.error.path}`;

    jest.spyOn(walletServiceSpy, 'executeContent').mockReturnValueOnce(throwError(() => mockErrorResponse));

    const addCameraLogSpy = jest.spyOn((component as any).cameraLogsService, 'addCameraLog');

    component.qrCodeEmit('someQrCode');
    tick(2000);

    expect(component.toggleScan).toBe(false);
    expect(addCameraLogSpy).toHaveBeenCalledWith(new Error(errorMessage), 'httpError');
  }));
});
