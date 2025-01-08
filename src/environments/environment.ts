export const environment = {
  production: false,
  server_url: 'http://localhost:8082',
  iam_url: 'http://localhost:7002',
  websocket_url: 'ws://localhost:8082',
  iam_params: {
    iam_uri: '/realms/wallet',
    client_id: 'auth-client',
    scope: 'openid profile email offline_access',
    grant_type: 'code'
  },
  server_uri: {
    execute_content_uri: '/api/v1/execute-content',
    request_credential_uri: '/api/v1/openid-credential-offer',
    verifiable_presentation_uri: '/api/v1/vp',
    credentials_uri: '/api/v1/credentials',
    credentials_by_id_uri: '/api/v1/credentials?credentialId=',
    credentials_signed_by_id_uri: '/api/v1/request-signed-credential',
    users_uri: '/api/v1/users',
    ebsi_did_uri: '/api/v1/ebsi-did',
    cbor: '/api/v1/vp/cbor',
  },
  websocket_uri: '/api/v1/pin',
  logs_enabled: false,
  logs_email: "domesupport@in2.es"
};
