//! Webull API authentication module

use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use reqwest::{Client, cookie::Jar};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::{debug, info, warn};
use uuid::Uuid;

const WEBULL_AUTH_URL: &str = "https://userapi.webull.com/api/passport/login";
const WEBULL_REFRESH_URL: &str = "https://userapi.webull.com/api/passport/refreshToken";
const WEBULL_MFA_URL: &str = "https://userapi.webull.com/api/passport/verificationCode";

/// Authentication credentials
#[derive(Debug, Clone)]
pub struct Credentials {
    pub username: String,
    pub password: String,
    pub device_id: String,
    pub mfa_code: Option<String>,
}

impl Credentials {
    /// Load credentials from environment variables
    pub fn from_env() -> Result<Self> {
        dotenv::dotenv().ok();

        let username = std::env::var("WEBULL_USERNAME")
            .context("WEBULL_USERNAME not set in environment")?;
        let password = std::env::var("WEBULL_PASSWORD")
            .context("WEBULL_PASSWORD not set in environment")?;
        let device_id = std::env::var("WEBULL_DEVICE_ID")
            .unwrap_or_else(|_| Uuid::new_v4().to_string());
        let mfa_code = std::env::var("WEBULL_MFA_CODE").ok();

        Ok(Self {
            username,
            password,
            device_id,
            mfa_code,
        })
    }
}

/// Authentication session
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    /// Access token
    pub access_token: String,

    /// Refresh token
    pub refresh_token: String,

    /// Token UUID
    pub token_uuid: String,

    /// Account ID
    pub account_id: String,

    /// User ID
    pub user_id: String,

    /// Expiration time
    pub expires_at: DateTime<Utc>,

    /// Cookie jar for session
    #[serde(skip)]
    pub cookies: Option<Arc<Jar>>,
}

impl Session {
    /// Check if session is expired
    pub fn is_expired(&self) -> bool {
        Utc::now() >= self.expires_at
    }

    /// Check if session needs refresh (within 5 minutes of expiry)
    pub fn needs_refresh(&self) -> bool {
        Utc::now() + chrono::Duration::minutes(5) >= self.expires_at
    }
}

/// Webull authenticator
pub struct WebullAuth {
    client: Client,
    credentials: Credentials,
}

impl WebullAuth {
    /// Create new authenticator
    pub fn new(credentials: Credentials) -> Result<Self> {
        let client = Client::builder()
            .cookie_store(true)
            .user_agent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36")
            .build()?;

        Ok(Self {
            client,
            credentials,
        })
    }

    /// Authenticate and create session
    pub async fn authenticate(&self) -> Result<Session> {
        info!("Authenticating with Webull API");

        // Step 1: Initial login request
        let login_payload = serde_json::json!({
            "account": self.credentials.username,
            "accountType": "2",  // Email login
            "deviceId": self.credentials.device_id,
            "deviceName": "AURELIA",
            "grade": "1",
            "pwd": self.hash_password(&self.credentials.password),
            "regionId": "1",
        });

        let response = self.client
            .post(WEBULL_AUTH_URL)
            .json(&login_payload)
            .send()
            .await
            .context("Failed to send login request")?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            anyhow::bail!("Login failed: {}", error_text);
        }

        let auth_response: AuthResponse = response.json().await
            .context("Failed to parse authentication response")?;

        // Step 2: Handle MFA if required
        let session = if auth_response.mfa_required {
            self.handle_mfa(&auth_response).await?
        } else {
            self.create_session(auth_response)?
        };

        info!("Successfully authenticated with Webull");
        debug!("Session expires at: {}", session.expires_at);

        Ok(session)
    }

    /// Refresh an existing session
    pub async fn refresh_session(&self, session: &Session) -> Result<Session> {
        info!("Refreshing Webull session");

        let refresh_payload = serde_json::json!({
            "refreshToken": session.refresh_token,
            "tokenUuid": session.token_uuid,
        });

        let response = self.client
            .post(WEBULL_REFRESH_URL)
            .json(&refresh_payload)
            .send()
            .await
            .context("Failed to send refresh request")?;

        if !response.status().is_success() {
            warn!("Session refresh failed, re-authenticating");
            return self.authenticate().await;
        }

        let auth_response: AuthResponse = response.json().await
            .context("Failed to parse refresh response")?;

        let refreshed_session = self.create_session(auth_response)?;

        info!("Session refreshed successfully");
        Ok(refreshed_session)
    }

    /// Hash password using Webull's algorithm
    fn hash_password(&self, password: &str) -> String {
        use sha2::{Digest, Sha256};

        let mut hasher = Sha256::new();
        hasher.update(password.as_bytes());
        let result = hasher.finalize();

        format!("{:x}", result)
    }

    /// Handle MFA verification
    async fn handle_mfa(&self, auth_response: &AuthResponse) -> Result<Session> {
        let mfa_code = self.credentials.mfa_code.as_ref()
            .context("MFA code required but not provided")?;

        info!("Submitting MFA code");

        let mfa_payload = serde_json::json!({
            "code": mfa_code,
            "codeType": "6",  // 6-digit MFA
            "deviceId": self.credentials.device_id,
        });

        let response = self.client
            .post(WEBULL_MFA_URL)
            .json(&mfa_payload)
            .send()
            .await
            .context("Failed to send MFA verification")?;

        if !response.status().is_success() {
            anyhow::bail!("MFA verification failed");
        }

        let mfa_response: AuthResponse = response.json().await
            .context("Failed to parse MFA response")?;

        self.create_session(mfa_response)
    }

    /// Create session from auth response
    fn create_session(&self, response: AuthResponse) -> Result<Session> {
        let expires_at = Utc::now() + chrono::Duration::seconds(response.expires_in);

        Ok(Session {
            access_token: response.access_token,
            refresh_token: response.refresh_token,
            token_uuid: response.token_uuid,
            account_id: response.account_id,
            user_id: response.user_id,
            expires_at,
            cookies: None,
        })
    }
}

/// Authentication response from Webull API
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AuthResponse {
    access_token: String,
    refresh_token: String,
    token_uuid: String,
    #[serde(default)]
    account_id: String,
    #[serde(default)]
    user_id: String,
    #[serde(default = "default_expires_in")]
    expires_in: i64,
    #[serde(default)]
    mfa_required: bool,
}

fn default_expires_in() -> i64 {
    3600 // 1 hour default
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_credentials_fields() {
        let creds = Credentials {
            username: "test@example.com".to_string(),
            password: "testpass".to_string(),
            device_id: "test-device".to_string(),
            mfa_code: None,
        };

        assert_eq!(creds.username, "test@example.com");
        assert_eq!(creds.device_id, "test-device");
    }

    #[test]
    fn test_session_expiry() {
        let session = Session {
            access_token: "token".to_string(),
            refresh_token: "refresh".to_string(),
            token_uuid: "uuid".to_string(),
            account_id: "account".to_string(),
            user_id: "user".to_string(),
            expires_at: Utc::now() - chrono::Duration::hours(1),
            cookies: None,
        };

        assert!(session.is_expired());
        assert!(session.needs_refresh());
    }
}
