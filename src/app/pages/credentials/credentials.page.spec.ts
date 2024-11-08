import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { AlertController, IonButton, IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { CredentialsPage } from './credentials.page';
import { WalletService } from 'src/app/services/wallet.service';
import { WebsocketService } from 'src/app/services/websocket.service';
import { DataService } from 'src/app/services/data.service';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CredentialStatus, VerifiableCredential } from 'src/app/interfaces/verifiable-credential';
import { Storage } from '@ionic/storage-angular';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { mockVCList } from 'src/assets/mocks/verifiable-credential.mock';


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
  let dataServiceSpyObj: jest.Mocked<any>;
  let alertController: AlertController;

  const TIME_IN_MS = 10000;

  beforeEach(waitForAsync(() => {

    walletServiceSpy = {
      getAllVCs: jest.fn().mockReturnValue(of([])),
      requestCredential: jest.fn().mockReturnValue(of({} as any)),
      deleteVC: jest.fn(),
      executeContent: jest.fn().mockReturnValue(of({} as any))
    } as unknown as jest.Mocked<WalletService>;

    websocketServiceSpy = {
      connect: jest.fn(),
      closeConnection: jest.fn()
    } as unknown as jest.Mocked<WebsocketService>;

    dataServiceSpyObj = {
      listenDid: jest.fn().mockReturnValue(of('someDidValue'))
    } as unknown as jest.Mocked<DataService>;

    const authServiceSpyObj = {
      getName: jest.fn()
    } as unknown as jest.Mocked<AuthenticationService>;

    mockRouter = new MockRouter();

    alertController = {
      create: jest.fn().mockResolvedValue({
        present: jest.fn().mockImplementation(()=>Promise.resolve()),
        onDidDismiss: jest.fn().mockResolvedValue({ role: 'ok' }),
      }),
    } as any;

    TestBed.configureTestingModule({
      schemas:[NO_ERRORS_SCHEMA],
      imports: [
        IonicModule.forRoot(),
        TranslateModule.forRoot(),
        RouterTestingModule,
        HttpClientTestingModule
      ],
      providers: [
        Storage,
        { provide: Router, useValue: mockRouter},
        { provide: AlertController, useValue: alertController },
        { provide: WalletService, useValue: walletServiceSpy },
        { provide: DataService, useValue: dataServiceSpyObj },
        { provide: AuthenticationService, useValue: authServiceSpyObj },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({ 
              toggleScan: 'toggle scan value',
              from: 'from value',
              show_qr: 'show_qr value',
              credentialOfferUri:'credentialOfferUri value'
             }),
            snapshot: {
              routeConfig: {
                path: 'credentials'
              }
            }
          },
        },
      ],
    })
    .overrideProvider(WebsocketService, {useValue: websocketServiceSpy })
    .overrideComponent(IonButton, { set: { template: '' } })
    .compileComponents();

    httpTestingController = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CredentialsPage);
    component = fixture.componentInstance;
  }));

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize credOfferEndpoint', ()=>{
    expect(component.credOfferEndpoint).toBe(window.location.origin + '/tabs/credentials');
  });

  it('should take query params to initialize properties', ()=>{
    expect(component.toggleScan).toBe('toggle scan value');
    expect(component.from).toBe('from value');
    expect(component.show_qr).toBe('show_qr value');
    expect(component.credentialOfferUri).toBe('credentialOfferUri value');
  });

  it('did and ebsiFlag should be initialized',()=>{
    expect(component.ebsiFlag).toBe(true);
    expect(component.did).toBe('someDidValue');
  })

  it('did and ebsiflag should not be initialized if listen emits empty string', ()=>{
    dataServiceSpyObj.listenDid.mockReturnValue(of(''));
    component.ebsiFlag = false;
    component.did = '';
    dataServiceSpyObj.listenDid().subscribe(()=>{
      expect(component.ebsiFlag).toBe(false);
      expect(component.did).toBe('');
    });
  });

  it('ngOnInit should initialize component properties and fetch credentials', () => {
    walletServiceSpy.getAllVCs.mockReturnValue(of([]));
    jest.spyOn(component, 'generateCred');
    jest.spyOn(component, 'fetchCredentials');
    component.ngOnInit();
    expect(component.scaned_cred).toBe(false);
    expect(component.fetchCredentials).toHaveBeenCalled();
    expect(component.generateCred).toHaveBeenCalled();
  });

  it('should untoggle scan and call detectChanges when navigation is outside /tabs/credentials', () => {
    const mockNavigationEndEvent = new NavigationEnd(42, '/tabs/credentials', '/new-url/tabs/other-section');
    walletServiceSpy.getAllVCs.mockReturnValue(of([]));

    const untoggleScanSpy = jest.spyOn(component, 'untoggleScan');
    const detectChangesSpy = jest.spyOn(component['cdr'], 'detectChanges').mockImplementation(()=>{});

    mockRouter.events.next(mockNavigationEndEvent);

    expect(untoggleScanSpy).toHaveBeenCalled();
    expect(detectChangesSpy).toHaveBeenCalled();
  });

  it('should not untoggle scan if the destination starts with /tabs/credentials', () => {
    const mockNavigationEndEvent = new NavigationEnd(42, '/tabs/credentials', '/tabs/credentials/some-subroute');
    walletServiceSpy.getAllVCs.mockReturnValue(of([]));
    const untoggleScanSpy = jest.spyOn(component, 'untoggleScan');
    const detectChangesSpy = jest.spyOn(component['cdr'], 'detectChanges');

    jest.spyOn(mockRouter.events, 'pipe').mockReturnValue(of(mockNavigationEndEvent));

    expect(untoggleScanSpy).not.toHaveBeenCalled();
    expect(detectChangesSpy).not.toHaveBeenCalled();
  });

  it('should not generate credential if credentialOfferUri (from query params) is undefined', ()=>{
    component.credentialOfferUri = undefined as any;
    jest.spyOn(component, 'generateCred');
    component.ngOnInit();
    expect(component.generateCred).toHaveBeenCalledTimes(0);
  })

  it('should enable scan mode when scan is called', () => {
    component.scan();
    expect(component.toggleScan).toBe(true);
    expect(component.show_qr).toBe(true);
    expect(component.ebsiFlag).toBe(false);
  });

  it('should only log error if text is not did-text nor endpoint-text', async () => {
    const clipboardSpy = jest.spyOn(navigator.clipboard, 'writeText');
    const consoleErrSpy = jest.spyOn(console, 'error');

    const textToCopy = 'invalidText';

    await component.copyToClipboard(textToCopy);

    expect(consoleErrSpy).toHaveBeenCalledWith('Invalid text to copy:', textToCopy);
    expect(clipboardSpy).not.toHaveBeenCalled();
  });

  it('should copy credOfferEndpoint if textToCopy is endpoint-text', async () => {
    const clipboardSpy = jest.spyOn(navigator.clipboard, 'writeText');

    const textToCopy = 'endpoint-text';

    await component.copyToClipboard(textToCopy);

    expect(clipboardSpy).toHaveBeenCalledWith(component.credOfferEndpoint || '');
  });

  it('should log error if there is not did-text copy element', async () => {
    const clipboardSpy = jest.spyOn(navigator.clipboard, 'writeText');
    jest.spyOn(document, 'getElementById').mockReturnValue(null);
    const consoleErrSpy = jest.spyOn(console, 'error');

    const textToCopy = 'did-text';

    await component.copyToClipboard(textToCopy);

    expect(clipboardSpy).not.toHaveBeenCalled();
    expect(consoleErrSpy).toHaveBeenCalledWith('Element with id "did-text" not found.');
  });

  it('should copy did-text with DID prefix', async () => {
    const clipboardSpy = jest.spyOn(navigator.clipboard, 'writeText');
    jest.spyOn(document, 'getElementById').mockReturnValue({innerText:'DID: inner text'} as any);

    const textToCopy = 'did-text';

    await component.copyToClipboard(textToCopy);

    expect(clipboardSpy).toHaveBeenCalledWith('inner text');
  });

  it('should generate credential after websocket connection', () => {
    const mockCredentialOfferUri = 'mockCredentialOfferUri';

    component.credentialOfferUri = mockCredentialOfferUri;
    component.generateCred();

    setTimeout(()=>{
      expect(walletServiceSpy.requestCredential).toHaveBeenCalledWith(mockCredentialOfferUri);
      expect(websocketServiceSpy.connect).toHaveBeenCalled();
    }, 1000);
  });

  it('should update the credential list when fetchCredentials is called',  async () => {
    const mockCredList: VerifiableCredential[] = mockVCList;

    walletServiceSpy.getAllVCs.mockReturnValue(of(mockCredList));

    component.fetchCredentials();

    expect(component.credList).toEqual(mockCredList.reverse());
  });


  it('vcDelete should call deleteVC on the wallet service with the correct ID and fetchCredentials the list', () => {
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
    jest.spyOn(component, 'fetchCredentials');
    component.vcDelete(testCredential);
    expect(walletServiceSpy.deleteVC).toHaveBeenCalledWith(testCredential.id);
    expect(component.fetchCredentials).toHaveBeenCalled();
  });

  it('qrCodeEmit should process QR code after websocket connection', () => {
    jest.spyOn(mockRouter, 'navigate');
    const testQrCode = "someTestQrCode";

    component.qrCodeEmit(testQrCode);

    setTimeout(()=>{
      expect(walletServiceSpy.executeContent).toHaveBeenCalledWith(testQrCode);
      expect(websocketServiceSpy.connect).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/tabs/vc-selector/'], { queryParams: { executionResponse: JSON.stringify({}) } });
    }, 1000);
  });


  it('should handle alert Cancel correctly', async () => {
    const alertCreateSpy = jest.spyOn(alertController, 'create');
    await component.credentialClick();

    expect(alertCreateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        header: expect.any(String),
        message: expect.any(String),
        buttons: expect.arrayContaining([
          expect.objectContaining({
            text: expect.any(String),
            role: 'cancel',
            handler: expect.any(Function)
          }),
          expect.objectContaining({
            text: expect.any(String),
            handler: expect.any(Function)
          }),
        ]),
      })
    );
    const alert = await alertCreateSpy.mock.results[0].value;
    expect(alert.present).toHaveBeenCalled();
  });


  it('should close websocket connection after credential request', () => {
    component.credentialOfferUri = 'mockCredentialOfferUri';
    component.generateCred();

    setTimeout(()=>{
      expect(walletServiceSpy.requestCredential).toHaveBeenCalled();
      expect(websocketServiceSpy.closeConnection).toHaveBeenCalled();
    }, 1000);
  });

  it('should close websocket connection if an error occurs', () => {
    jest.spyOn(walletServiceSpy, 'requestCredential').mockReturnValueOnce(throwError(() => new Error('Test error')));

    component.credentialOfferUri = 'mockCredentialOfferUri';
    component.generateCred();

    setTimeout(()=>{
      expect(walletServiceSpy.requestCredential).toHaveBeenCalled();
      expect(websocketServiceSpy.closeConnection).toHaveBeenCalled();
    }, 1000);
  });


  it('should log error to cameraLogsService when executeContent fails', () => {
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
    setTimeout(()=>{
      expect(component.toggleScan).toBe(true);
      expect(addCameraLogSpy).toHaveBeenCalledWith(new Error(errorMessage), 'httpError');
    }, 1000);
  });

  it('untoggleScan function should set toggleScan to false', ()=>{
    component.untoggleScan();
    expect(component.toggleScan).toBe(false);
  });

  it('should call requestCredential and navigate on success', () => {
    const scanSpy = jest.spyOn(component, 'scan');
    const clickSpy = jest.spyOn(component, 'credentialClick');
    let event: any = {key: 'randomKey', preventDefault: ()=>''}
    let action = 'scan';
    const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

    component.handleButtonKeydown(event, action);

    expect(preventDefaultSpy).toHaveBeenCalledTimes(0);
    expect(scanSpy).toHaveBeenCalledTimes(0);
    expect(clickSpy).toHaveBeenCalledTimes(0);

    event.key = 'Enter';
    component.handleButtonKeydown(event, action);
    expect(preventDefaultSpy).toHaveBeenCalledTimes(1);
    expect(scanSpy).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(0);

    event.key = ' ';
    component.handleButtonKeydown(event, action);
    expect(preventDefaultSpy).toHaveBeenCalledTimes(2);
    expect(scanSpy).toHaveBeenCalledTimes(2);
    expect(clickSpy).toHaveBeenCalledTimes(0);

    action = 'getCredential';
    component.handleButtonKeydown(event, action);
    expect(preventDefaultSpy).toHaveBeenCalledTimes(3);
    expect(scanSpy).toHaveBeenCalledTimes(2);
    expect(clickSpy).toHaveBeenCalledTimes(1);

    action = 'randomAction';
    component.handleButtonKeydown(event, action);
    expect(preventDefaultSpy).toHaveBeenCalledTimes(4);
    expect(scanSpy).toHaveBeenCalledTimes(2);
    expect(clickSpy).toHaveBeenCalledTimes(1);

  });

});
