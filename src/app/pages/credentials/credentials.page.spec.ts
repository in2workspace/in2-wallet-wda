import { ComponentFixture, TestBed, fakeAsync, flush, tick, waitForAsync } from '@angular/core/testing';
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
import { DestroyRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { mockVCList } from 'src/assets/mocks/verifiable-credential.mock';
import { HttpErrorResponse } from '@angular/common/http';


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
  let mockRoute: any;

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

    mockRoute = {
      queryParams: of({ 
        toggleScan: 'toggle scan value',
        from: 'from value',
        show_qr: 'show_qr value',
        credentialOfferUri:'credentialOfferUri value'
       }),
      snapshot: {
        routeConfig: {
          path: 'credentials'
        },
        queryParams: {
          scaned_cred: false
        }
      }
    };

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
        DestroyRef,
        { provide: Router, useValue: mockRouter},
        { provide: AlertController, useValue: alertController },
        { provide: WalletService, useValue: walletServiceSpy },
        { provide: DataService, useValue: dataServiceSpyObj },
        { provide: AuthenticationService, useValue: authServiceSpyObj },
        {
          provide: ActivatedRoute, useValue: mockRoute
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
    expect(component.from).toBe('from value');
    expect(component.credentialOfferUri).toBe('credentialOfferUri value');
  });

  it('did and ebsiFlag should be initialized if listenDid is not undefined',()=>{
    expect(component.ebsiFlag).toBe(true);
    expect(component.did).toBe('someDidValue');
  });

  it('did and ebsiflag should not be initialized if listenDid emits empty string', ()=>{
    dataServiceSpyObj.listenDid.mockReturnValue(of(undefined));
    component.ebsiFlag = false;
    component.did = undefined;
    dataServiceSpyObj.listenDid().subscribe(()=>{
      expect(component.ebsiFlag).toBe(false);
      expect(component.did).toBe(undefined);
    });
  });

  it('ngOnInit should fetch credentials', () => {
    walletServiceSpy.getAllVCs.mockReturnValue(of([]));
    jest.spyOn(component, 'loadCredentials');
    jest.spyOn(component, 'openOfferSuccessPopup');
    component.ngOnInit();
    expect(component.loadCredentials).toHaveBeenCalled();
    expect(component.openOfferSuccessPopup).not.toHaveBeenCalled();
  });

  it('open popup fn should be opened on init if scaned_cred is true', () => {
    mockRoute.snapshot.queryParams['scaned_cred'] = true;
    jest.spyOn(component, 'openOfferSuccessPopup');

    component.ngOnInit();
    expect(component.openOfferSuccessPopup).toHaveBeenCalled();
  });

  it('should generate credentials on init', () => {
    component.credentialOfferUri = 'uri';
    jest.spyOn(component, 'generateCred');

    component.ngOnInit();
    expect(component.generateCred).toHaveBeenCalled();
  });

  it('should not generate credential if credentialOfferUri (from query params) is undefined', ()=>{
    component.credentialOfferUri = undefined as any;
    jest.spyOn(component, 'generateCred');
    component.ngOnInit();
    expect(component.generateCred).toHaveBeenCalledTimes(0);
  });

  it('should open and close success popup', fakeAsync(()=>{
    component.openOfferSuccessPopup();

    expect(component.showOfferSuccessPopup).toBe(true);
    tick(TIME_IN_MS);
    expect(component.showOfferSuccessPopup).toBe(false);
  }));

  it('should update the credential list when fetchCredentials is called', fakeAsync(() => {
    const mockCredList: VerifiableCredential[] = mockVCList;
    const nextSpy = jest.spyOn(component.loadedCredentialsSubj, 'next');
    walletServiceSpy.getAllVCs.mockReturnValue(of(mockCredList));
    const reversedList = mockCredList.reverse();

    component.loadCredentials().subscribe(vcs => {
      expect(walletServiceSpy.getAllVCs).toHaveBeenCalled();
      expect(nextSpy).toHaveBeenCalledWith(reversedList);
      expect(vcs).toEqual(reversedList);
    });

    flush();

}));

it('no credentials should return and update credentials list as empty', fakeAsync(()=>{
  const nextSpy = jest.spyOn(component.loadedCredentialsSubj, 'next');

  (walletServiceSpy as any).getAllVCs
  .mockReturnValue(throwError(()=>new HttpErrorResponse({
    status:404
  })));
  component.loadCredentials().subscribe(vcs =>{
    console.log('vcs: ')
    console.log(vcs);
    expect(vcs).toEqual([]);
    expect(nextSpy).toHaveBeenCalledWith([]);
  });

  flush();

}));

it('any other error than 404 should cut the stream', fakeAsync(()=>{
  const nextSpy = jest.spyOn(component.loadedCredentialsSubj, 'next');

  (walletServiceSpy as any).getAllVCs
  .mockReturnValue(throwError(()=>new HttpErrorResponse({
    status:500
  })));
  let loadCredentialHasEmitted = false;
  component.loadCredentials().subscribe(vcs =>{
    loadCredentialHasEmitted = true;
  });

  flush();

  expect(loadCredentialHasEmitted).toBe(false);
  expect(nextSpy).not.toHaveBeenCalled();

}));

it('vcDelete should call deleteVC on the wallet service with the correct ID and fetchCredentials the list', fakeAsync(() => {
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
  jest.spyOn(component, 'loadCredentials');
  component.vcDelete(testCredential);

  expect(walletServiceSpy.deleteVC).toHaveBeenCalledWith(testCredential.id);
  
  tick();
  
  expect(component.loadCredentials).toHaveBeenCalled();
}));

it('should generate credential after websocket connection, update list and close connection', fakeAsync(() => {
  const mockCredentialOfferUri = 'mockCredentialOfferUri';
  jest.spyOn(component, 'loadCredentials');

  component.credentialOfferUri = mockCredentialOfferUri;
  component.generateCred();

  tick(1000);
  expect(websocketServiceSpy.connect).toHaveBeenCalled();
  expect(walletServiceSpy.requestCredential).toHaveBeenCalledWith(mockCredentialOfferUri);
  expect(component.loadCredentials).toHaveBeenCalled();
  expect(websocketServiceSpy.closeConnection).toHaveBeenCalled();
  
}));

 it('should close websocket connection after credential request', fakeAsync(() => {
    component.credentialOfferUri = 'mockCredentialOfferUri';
    component.generateCred();

    tick(1000);
    expect(walletServiceSpy.requestCredential).toHaveBeenCalled();
    expect(websocketServiceSpy.closeConnection).toHaveBeenCalled();
  }));

it('generate credential error should be handled closing connection', fakeAsync(()=>{
  walletServiceSpy.requestCredential.mockReturnValue(throwError(()=>new HttpErrorResponse({
  })));

  component.generateCred();
  flush();

  expect(walletServiceSpy.requestCredential).toHaveBeenCalled();
  expect(websocketServiceSpy.closeConnection).toHaveBeenCalled();
}));

it('should navigate keeping query params', fakeAsync(()=>{
  jest.spyOn(mockRouter, 'navigate');
  const uri = 'randomUri'
  component.navigateWithParamsTo(uri);
  tick();
  expect(mockRouter.navigate).toHaveBeenCalledWith([uri],  { 
    queryParamsHandling: 'preserve'
  });
})); 

it('should navigate keeping params and prevent event default', ()=>{
    let randomEvent: any = {key: 'randomKey', preventDefault: ()=>''}
    const preventDefaultSpy = jest.spyOn(randomEvent, 'preventDefault');
    jest.spyOn(component, 'navigateWithParamsTo');

    component.handleButtonKeydown(randomEvent, 'scan');
    expect(component.navigateWithParamsTo).not.toHaveBeenCalled();
    expect(preventDefaultSpy).not.toHaveBeenCalled();

    
    let enterEvent: any = {key: 'Enter', preventDefault: ()=>''};
    const preventEnterDefaultSpy = jest.spyOn(enterEvent, 'preventDefault');

    component.handleButtonKeydown(enterEvent, 'not-scan');
    expect(component.navigateWithParamsTo).not.toHaveBeenCalled();
    expect(preventEnterDefaultSpy).toHaveBeenCalled();

    component.handleButtonKeydown(enterEvent, 'scan');
    expect(component.navigateWithParamsTo).toHaveBeenCalledWith('tabs/credentials/scanner');
    expect(preventEnterDefaultSpy).toHaveBeenCalledTimes(2);

    let spaceEvent:any = {key: ' ', preventDefault: ()=>''};
    const preventSpaceDefaultSpy = jest.spyOn(spaceEvent, 'preventDefault');

    component.handleButtonKeydown(spaceEvent, 'scan');
    expect(component.navigateWithParamsTo).toHaveBeenCalled();
    expect(preventSpaceDefaultSpy).toHaveBeenCalled();

});

  it('should delay', fakeAsync(() => {
    const promise = (component as any).delay(1000);
    let isPromisedResolved = false;
    promise.then(()=>{
      isPromisedResolved = true;
    });
    expect(isPromisedResolved).toBe(false);

    tick(1000);
    expect(isPromisedResolved).toBe(true);

  }));

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

});
