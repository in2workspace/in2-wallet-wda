import { CredentialStatus } from "src/app/interfaces/verifiable-credential";

export const mockVC =  {
    "@context": ["https://www.w3.org/ns/credentials/v2"],
    "id": "1",
    "type": ["VerifiableCredential", "SomeType"],
    "issuer": {
      "id": "issuerId1"
    },
    "issuanceDate": "2021-01-01T00:00:00Z",
    "validFrom": "2021-01-01T00:00:00Z",
    "expirationDate": "2025-12-31T23:59:59Z",
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
  };

  export const mockVCList = [mockVC];