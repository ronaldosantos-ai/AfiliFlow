"""
Credenciais Creators API v3.x usam Login with Amazon (LWA) em api.amazon.com.
O amazon-creatorsapi-python-sdk 1.0.0 só define token Cognito para v2.1–2.3.
Este módulo estende suporte a versões 3.* antes de instanciar o ApiClient.
"""

from __future__ import annotations

import json
import time
from typing import Any, Callable

import requests

_PATCHED = False

# Região NA (inclui amazon.com.br). EU / FE: defina AMAZON_CREATORS_AUTH_ENDPOINT no .env.
_DEFAULT_LWA_TOKEN_URL = "https://api.amazon.com/auth/o2/token"


def apply() -> None:
    global _PATCHED
    if _PATCHED:
        return

    from creatorsapi_python_sdk.auth import oauth2_config as oc_mod
    from creatorsapi_python_sdk.auth.oauth2_token_manager import OAuth2TokenManager

    _orig_determine: Callable[..., Any] = oc_mod.OAuth2Config.determine_token_endpoint
    _orig_refresh: Callable[..., Any] = OAuth2TokenManager.refresh_token

    def determine_token_endpoint(self, version, auth_endpoint):
        if auth_endpoint and str(auth_endpoint).strip():
            return auth_endpoint
        v = (version or "").strip()
        if v.startswith("3."):
            return _DEFAULT_LWA_TOKEN_URL
        return _orig_determine(self, version, auth_endpoint)

    def refresh_token(self):
        v = (self.config.get_version() or "").strip()
        if v.startswith("3."):
            try:
                url = self.config.get_cognito_endpoint()
                payload = {
                    "grant_type": self.config.get_grant_type(),
                    "client_id": self.config.get_credential_id(),
                    "client_secret": self.config.get_credential_secret(),
                    "scope": self.config.get_scope(),
                }
                response = requests.post(
                    url,
                    data=json.dumps(payload),
                    headers={"Content-Type": "application/json"},
                    timeout=30,
                )
                if response.status_code != 200:
                    raise RuntimeError(
                        "OAuth2 token request failed with status {}: {}".format(
                            response.status_code, response.text
                        )
                    )
                data = response.json()
                if "access_token" not in data:
                    raise RuntimeError("No access token received from OAuth2 endpoint")
                self.access_token = data["access_token"]
                expires_in = data.get("expires_in", 3600)
                self.expires_at = time.time() + max(int(expires_in) - 30, 60)
                return self.access_token
            except requests.exceptions.RequestException as e:
                self.clear_token()
                raise RuntimeError("OAuth2 token request failed: {}".format(e)) from e
            except json.JSONDecodeError as e:
                self.clear_token()
                raise RuntimeError(
                    "Failed to parse OAuth2 token response: {}".format(e)
                ) from e
            except Exception:
                self.clear_token()
                raise

        return _orig_refresh(self)

    oc_mod.OAuth2Config.determine_token_endpoint = determine_token_endpoint
    OAuth2TokenManager.refresh_token = refresh_token
    _PATCHED = True
