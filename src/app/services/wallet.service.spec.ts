import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { WalletService } from './wallet.service';
import { environment } from 'src/environments/environment';
import {
  CredentialStatus,
  VerifiableCredential,
} from '../interfaces/verifiable-credential';

interface VCReply {
  selectedVcList: any[];
  state: string;
  redirectUri: string;
  nonce: string;
}

describe('WalletService', () => {
  let service: WalletService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [WalletService],
    });
    service = TestBed.inject(WalletService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should fetch VC in CBOR format', (done) => {
    const mockCredential: VerifiableCredential = {
      '@context': ['https://www.w3.org/ns/credentials/v1'],
      id: 'test-credential-id',
      type: ['VerifiableCredential', 'LEARCredentialEmployee'],
      issuer: {
        id: 'did:web:provider.dome.fiware.dev',
      },
      issuanceDate: '2024-04-02T09:23:22.637345122Z',
      validFrom: '2024-04-02T09:23:22.637345122Z',
      expirationDate: '2025-01-01T00:00:00Z',
      credentialSubject: {
        mandate: {
          id: 'mandateId1',
          mandator: {
            organizationIdentifier: 'orgId1',
            commonName: 'Common Name',
            emailAddress: 'email@example.com',
            serialNumber: 'serialNumber1',
            organization: 'Organization Name',
            country: 'Country',
          },
          mandatee: {
            id: 'personId1',
            first_name: 'John',
            last_name: 'Doe',
            gender: 'male',
            email: 'test@example.com',
            mobile_phone: '+1234567890',
          },
          power: [
            {
              id: 'powerId1',
              tmf_type: 'Domain',
              tmf_domain: ['DOME'],
              tmf_function: 'Onboarding',
              tmf_action: ['Execute'],
            },
          ],
          life_span: {
            start_date_time: '2024-04-02T09:23:22.637345122Z',
            end_date_time: '2025-01-01T00:00:00Z',
          },
        },
      },
      status: CredentialStatus.ISSUED,
    };
    const mockResponse = 'mock-cbor-data';

    service.getVCinCBOR(mockCredential).subscribe((response) => {
      expect(response).toEqual(mockResponse);
      done();
    });

    const req = httpTestingController.expectOne(
      `${environment.server_url}/api/v1/vp/cbor`
    );
    expect(req.request.method).toEqual('POST');
    req.flush(mockResponse);
  });

  it('should fetch VC in JWT format', (done) => {
    const mockCredentialId = 'test-credential-id';
    const mockResponse = 'mock-jwt-data';

    service
      .getVCinJWT({ id: mockCredentialId } as VerifiableCredential)
      .subscribe((response) => {
        expect(response).toEqual(mockResponse);
        done();
      });

    const req = httpTestingController.expectOne(
      `${environment.server_url}/api/credentials/id?credentialId=${mockCredentialId}&format=vc_jwt`
    );
    expect(req.request.method).toEqual('GET');
    req.flush(mockResponse);
  });

  it('should request a new credential', (done) => {
    const mockCredentialOfferUri = 'test-offer-uri';
    const expectedResponse = {
      message: 'Credential request successful',
    };

    service.requestOpenidCredentialOffer(mockCredentialOfferUri).subscribe((response) => {
      expect(response).toEqual(expectedResponse);
      done();
    });

    const req = httpTestingController.expectOne(
      `${
        environment.server_url + environment.server_uri.request_credential_uri
      }`
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      credential_offer_uri: mockCredentialOfferUri,
    });
    req.flush(expectedResponse);
  });

  it('should execute Verifiable Credential and return response', (done) => {
    const mockVCReply: VCReply = {
      selectedVcList: [],
      state: 'test-state',
      redirectUri: 'test-redirect-uri',
      nonce: 'test-nonce',
    };
    const mockResponse = 'VC executed successfully';

    service.executeVC(mockVCReply).subscribe((response) => {
      expect(response).toEqual(mockResponse);
      done();
    });

    const req = httpTestingController.expectOne(
      `${
        environment.server_url +
        environment.server_uri.verifiable_presentation_uri
      }`
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockVCReply);
    req.flush(mockResponse);
  });

  it('should fetch all Verifiable Credentials', (done) => {
    const mockResponse: VerifiableCredential[] = [
      {
        '@context': ['https://www.w3.org/ns/credentials/v1'],
        id: 'example-credential-id',
        type: ['VerifiableCredential', 'LEARCredentialEmployee'],
        issuer: {
          id: 'did:web:provider.dome.fiware.dev',
        },
        issuanceDate: '2024-04-02T09:23:22.637345122Z',
        validFrom: '2024-04-02T09:23:22.637345122Z',
        expirationDate: '2030-01-01T00:00:00Z',
        credentialSubject: {
          mandate: {
            id: 'mandateId1',
            mandator: {
              organizationIdentifier: 'orgId1',
              commonName: 'Example Unit',
              emailAddress: 'example@test.com',
              serialNumber: 'serialNumber1',
              organization: 'Organization Name',
              country: 'Country',
            },
            mandatee: {
              id: 'personId1',
              first_name: 'Jane',
              last_name: 'Doe',
              gender: 'female',
              email: 'example@test.com',
              mobile_phone: '+0987654321',
            },
            power: [
              {
                id: 'powerId1',
                tmf_type: 'Domain',
                tmf_domain: ['SomeDomain'],
                tmf_function: 'SomeFunction',
                tmf_action: ['SomeAction'],
              },
            ],
            life_span: {
              start_date_time: '2024-04-02T09:23:22.637345122Z',
              end_date_time: '2030-01-01T00:00:00Z',
            },
          },
        },
        status: CredentialStatus.ISSUED,
      },
    ];

    service.getAllVCs().subscribe((credentials) => {
      expect(credentials.length).toBeGreaterThan(0);
      expect(credentials).toEqual(mockResponse);
      done();
    });

    const req = httpTestingController.expectOne(
      `${environment.server_url + environment.server_uri.credentials_uri}`
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should fetch a single Verifiable Credential by id', (done) => {
    const data = 'test-id';
    const mockResponse: VerifiableCredential = {
      '@context': ['https://www.w3.org/ns/credentials/v1'],
      id: 'single-test-credential-id',
      type: ['VerifiableCredential', 'LEARCredentialEmployee'],
      issuer: {
        id: 'did:web:provider.dome.fiware.dev',
      },
      issuanceDate: '2024-04-02T09:23:22.637345122Z',
      validFrom: '2024-04-02T09:23:22.637345122Z',
      expirationDate: '2030-01-01T00:00:00Z',
      credentialSubject: {
        mandate: {
          id: 'mandateId1',
          mandator: {
            organizationIdentifier: 'orgId1',
            commonName: 'Test Unit',
            emailAddress: 'single@test.com',
            serialNumber: 'serialNumber1',
            organization: 'Organization Name',
            country: 'Country',
          },
          mandatee: {
            id: 'personId1',
            first_name: 'Single',
            last_name: 'Credential',
            gender: 'other',
            email: 'single@test.com',
            mobile_phone: '+1234567890',
          },
          power: [
            {
              id: 'powerId1',
              tmf_type: 'Domain',
              tmf_domain: ['SomeDomain'],
              tmf_function: 'SomeFunction',
              tmf_action: ['SomeAction'],
            },
          ],
          life_span: {
            start_date_time: '2024-04-02T09:23:22.637345122Z',
            end_date_time: '2030-01-01T00:00:00Z',
          },
        },
      },
      status: CredentialStatus.ISSUED,
    };

    service.getOne(data).subscribe((credential) => {
      expect(credential).toEqual(mockResponse);
      done();
    });

    const req = httpTestingController.expectOne(
      `${environment.server_url}/api/vc/1/${data}/format?format=vc_json`
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should delete a Verifiable Credential by id', (done) => {
    const VC = 'test-vc-id';
    const mockResponse = 'VC deleted successfully';

    service.deleteVC(VC).subscribe((response) => {
      expect(response).toEqual(mockResponse);
      done();
    });

    const req = httpTestingController.expectOne(
      `${
        environment.server_url +
        environment.server_uri.credentials_by_id_uri +
        VC
      }`
    );
    expect(req.request.method).toBe('DELETE');
    req.flush(mockResponse);
  });

  it('should request a signature for a given credential ID', (done) => {
    const credentialId = 'test-credential-id';
    const expectedResponse = 'Signed Credential';

    service.requestSignature(credentialId).subscribe((response) => {
      expect(response.body).toEqual(expectedResponse);
      done();
    });

    const req = httpTestingController.expectOne(
      `${
        environment.server_url +
        environment.server_uri.credentials_signed_by_id_uri
      }?credentialId=${credentialId}`
    );
    expect(req.request.method).toBe('GET');
    req.flush(expectedResponse);
  });
});
