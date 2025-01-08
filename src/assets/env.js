(function (window) {
  window["env"] = window["env"] || {};

  // Environment variables
  window["env"]["server_url"] = 'http://localhost:8082';
  window["env"]["websocket_url"] = 'ws://localhost:8082';
  window["env"]["websocket_uri"] = '/api/v2/pin';
  window["env"]["iam_url"] ='http://localhost:7002';
  window["env"]["iam_uri"] = '/realms/wallet';
  window["env"]["client_id"] = 'auth-client';
  window["env"]["scope"] = 'openid profile email offline_access';
  window["env"]["grant_type"] = 'code';
  window["env"]["execute_content_uri"] = '/api/v2/execute-content';
  window["env"]["request_credential_uri"] = '/api/v2/openid-credential-offer';
  window["env"]["verifiable_presentation_uri"] = '/api/v2/verifiable-presentation';
  window["env"]["credentials_uri"] = '/api/v2/credentials';
  window["env"]["credentials_by_id_uri"] = '/api/v2/credentials?credentialId=';
  window["env"]["credentials_signed_by_id_uri"] = '/api/v1/request-signed-credential';
  window["env"]["users_uri"] = '/api/v2/users';
  window["env"]["ebsi_did_uri"] = '/api/v2/ebsi-did';
  window["env"]["cbor_uri"] = '/api/v2/vp/cbor';
  window["env"]["logs_enabled"] = "false";
  window["env"]["logs_email"] = "domesupport@in2.es";
})(this);
