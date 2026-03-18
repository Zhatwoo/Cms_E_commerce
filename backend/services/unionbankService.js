const axios = require('axios');

class UnionBankService {
  constructor() {
    this.clientId = process.env.UNIONBANK_CLIENT_ID;
    this.clientSecret = process.env.UNIONBANK_CLIENT_SECRET;
    this.partnerId = process.env.UNIONBANK_PARTNER_ID;
    this.redirectUri = process.env.UNIONBANK_REDIRECT_URI;
    this.baseUrl = 'https://api-uat.unionbankph.com/partners/sb/convergent/v1'; // Sandbox Base URL
  }

  getAuthUrl(userId) {
    const scopes = 'account_balances payments transfers';
    // UnionBank Sandbox Authorize Endpoint
    return `https://api-uat.unionbankph.com/partners/sb/convergent/v1/oauth2/authorize?client_id=${this.clientId}&redirect_uri=${encodeURIComponent(this.redirectUri)}&scope=${encodeURIComponent(scopes)}&response_type=code&state=${userId}`;
  }

  async handleCallback(code) {
    const url = 'https://api-uat.unionbankph.com/partners/sb/convergent/v1/oauth2/token';
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', this.clientId);
    params.append('client_secret', this.clientSecret);
    params.append('code', code);
    params.append('redirect_uri', this.redirectUri);

    const response = await axios.post(url, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-ibm-client-id': this.clientId,
        'x-ibm-client-secret': this.clientSecret
      }
    });

    return response.data;
  }
}

module.exports = new UnionBankService();
