const axios = require('axios');
const readline = require('readline');

const BASE_URL = 'https://topt-back-47b6d49bc89e.herokuapp.com';

class APITester {
  constructor() {
    this.userToken = null;
    this.adminToken = null;
    this.testUserMobile = '+15714305024';
    this.testAdminCredentials = { username: 'admin', password: 'demo123' };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m',
      reset: '\x1b[0m'
    };
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async makeRequest(method, url, data = null, headers = {}) {
    try {
      const config = {
        method,
        url: BASE_URL + url,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      if (data && (method === 'post' || method === 'put')) {
        config.data = data;
      }

      const response = await axios(config);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status
      };
    }
  }

  async testAuthenticationEndpoints() {
    this.log('🧪 Testing Authentication Endpoints...', 'info');

    // Test TOTP Request
    this.log('Testing TOTP Request...');
    const requestOtp = await this.makeRequest('post', '/api/auth/request-otp', {
      mobile: this.testUserMobile
    });
    if (requestOtp.success) {
      this.log('✅ TOTP Request successful', 'success');
    } else {
      this.log(`❌ TOTP Request failed: ${JSON.stringify(requestOtp.error)}`, 'error');
    }

    // Test Admin Login
    this.log('Testing Admin Login...');
    const adminLogin = await this.makeRequest('post', '/api/admin/login', this.testAdminCredentials);
    if (adminLogin.success) {
      this.adminToken = adminLogin.data.token;
      this.log('✅ Admin Login successful', 'success');
    } else {
      this.log(`❌ Admin Login failed: ${JSON.stringify(adminLogin.error)}`, 'error');
    }

    // Test Auth Status (should fail without token)
    this.log('Testing Auth Status without token...');
    const authStatusNoToken = await this.makeRequest('get', '/api/auth/status');
    if (!authStatusNoToken.success && authStatusNoToken.status === 401) {
      this.log('✅ Auth Status correctly rejects without token', 'success');
    } else {
      this.log(`❌ Auth Status should reject without token: ${JSON.stringify(authStatusNoToken)}`, 'error');
    }
  }

  async testUserAuthentication() {
    this.log('🔐 Testing User Authentication Flow...', 'info');

    // Get TOTP code from user
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question('Enter the 6-digit TOTP code from your app: ', async (otp) => {
        rl.close();

        try {
          // Test TOTP Verification
          this.log('Testing TOTP Verification...');
          const verifyOtp = await this.makeRequest('post', '/api/auth/verify-otp', {
            mobile: this.testUserMobile,
            otp: otp
          });

          if (verifyOtp.success) {
            this.userToken = verifyOtp.data.token;
            this.log('✅ TOTP Verification successful', 'success');

            // Test Auth Status with token
            this.log('Testing Auth Status with token...');
            const authStatus = await this.makeRequest('get', '/api/auth/status', null, {
              Authorization: `Bearer ${this.userToken}`
            });
            if (authStatus.success) {
              this.log('✅ Auth Status works with token', 'success');
            } else {
              this.log(`❌ Auth Status failed: ${JSON.stringify(authStatus.error)}`, 'error');
            }

            // Test Profile endpoint
            this.log('Testing User Profile...');
            const profile = await this.makeRequest('get', '/api/auth/profile', null, {
              Authorization: `Bearer ${this.userToken}`
            });
            if (profile.success) {
              this.log('✅ User Profile works', 'success');
            } else {
              this.log(`❌ User Profile failed: ${JSON.stringify(profile.error)}`, 'error');
            }

          } else {
            this.log(`❌ TOTP Verification failed: ${JSON.stringify(verifyOtp.error)}`, 'error');
          }
        } catch (error) {
          this.log(`❌ User Authentication error: ${error.message}`, 'error');
        }

        resolve();
      });
    });
  }

  async testUserEndpoints() {
    if (!this.userToken) {
      this.log('⚠️ Skipping User Endpoints - no user token available', 'warning');
      return;
    }

    this.log('👤 Testing User Endpoints...', 'info');

    // Test Documents endpoint
    this.log('Testing GET /api/user/documents...');
    const documents = await this.makeRequest('get', '/api/user/documents', null, {
      Authorization: `Bearer ${this.userToken}`
    });
    if (documents.success) {
      this.log(`✅ Documents endpoint works - ${documents.data.length || 0} documents found`, 'success');
    } else {
      this.log(`❌ Documents endpoint failed: ${JSON.stringify(documents.error)}`, 'error');
    }

    // Test Token Refresh
    this.log('Testing Token Refresh...');
    const refresh = await this.makeRequest('post', '/api/auth/refresh', null, {
      Authorization: `Bearer ${this.userToken}`
    });
    if (refresh.success) {
      this.userToken = refresh.data.token; // Update token
      this.log('✅ Token Refresh successful', 'success');
    } else {
      this.log(`❌ Token Refresh failed: ${JSON.stringify(refresh.error)}`, 'error');
    }
  }

  async testAdminEndpoints() {
    if (!this.adminToken) {
      this.log('⚠️ Skipping Admin Endpoints - no admin token available', 'warning');
      return;
    }

    this.log('👑 Testing Admin Endpoints...', 'info');

    // Test Get Users
    this.log('Testing GET /api/admin/users...');
    const getUsers = await this.makeRequest('get', '/api/admin/users', null, {
      Authorization: `Bearer ${this.adminToken}`
    });
    if (getUsers.success) {
      this.log(`✅ Get Users works - ${getUsers.data.users.length} users found`, 'success');
    } else {
      this.log(`❌ Get Users failed: ${JSON.stringify(getUsers.error)}`, 'error');
    }

    // Test Get Documents
    this.log('Testing GET /api/admin/documents...');
    const getDocuments = await this.makeRequest('get', '/api/admin/documents', null, {
      Authorization: `Bearer ${this.adminToken}`
    });
    if (getDocuments.success) {
      this.log(`✅ Get Documents works - ${getDocuments.data.documents.length} documents found`, 'success');
    } else {
      this.log(`❌ Get Documents failed: ${JSON.stringify(getDocuments.error)}`, 'error');
    }

    // Test Add User
    this.log('Testing POST /api/admin/users...');
    const addUser = await this.makeRequest('post', '/api/admin/users', {
      mobile: '+15551234567'
    }, {
      Authorization: `Bearer ${this.adminToken}`
    });
    if (addUser.success) {
      this.log('✅ Add User successful', 'success');
      // Store the user ID for later deletion
      this.testUserId = addUser.data.user.id;
    } else {
      this.log(`❌ Add User failed: ${JSON.stringify(addUser.error)}`, 'error');
    }

    // Test Verify User
    this.log('Testing POST /api/admin/users/verify...');
    const verifyUser = await this.makeRequest('post', '/api/admin/users/verify', {
      mobile: '+15551234567'
    }, {
      Authorization: `Bearer ${this.adminToken}`
    });
    if (verifyUser.success) {
      this.log('✅ Verify User successful', 'success');
    } else {
      this.log(`❌ Verify User failed: ${JSON.stringify(verifyUser.error)}`, 'error');
    }

    // Test Add Document
    this.log('Testing POST /api/admin/documents...');
    const addDocument = await this.makeRequest('post', '/api/admin/documents', {
      title: 'Test Document',
      description: 'Test document for API testing',
      google_drive_link: 'https://drive.google.com/file/d/1test123/view'
    }, {
      Authorization: `Bearer ${this.adminToken}`
    });
    if (addDocument.success) {
      this.log('✅ Add Document successful', 'success');
      this.testDocumentId = addDocument.data.document.id;
    } else {
      this.log(`❌ Add Document failed: ${JSON.stringify(addDocument.error)}`, 'error');
    }
  }

  async testErrorCases() {
    this.log('🚨 Testing Error Cases...', 'info');

    // Test invalid TOTP
    this.log('Testing Invalid TOTP...');
    const invalidOtp = await this.makeRequest('post', '/api/auth/verify-otp', {
      mobile: this.testUserMobile,
      otp: '000000'
    });
    if (!invalidOtp.success && invalidOtp.status === 401) {
      this.log('✅ Invalid TOTP correctly rejected', 'success');
    } else {
      this.log(`❌ Invalid TOTP should be rejected: ${JSON.stringify(invalidOtp)}`, 'error');
    }

    // Test unauthorized access
    this.log('Testing Unauthorized Admin Access...');
    const unauthorizedAdmin = await this.makeRequest('get', '/api/admin/users');
    if (!unauthorizedAdmin.success && unauthorizedAdmin.status === 401) {
      this.log('✅ Unauthorized admin access correctly rejected', 'success');
    } else {
      this.log(`❌ Unauthorized admin access should be rejected: ${JSON.stringify(unauthorizedAdmin)}`, 'error');
    }

    // Test invalid document ID
    if (this.adminToken) {
      this.log('Testing Invalid Document ID...');
      const invalidDocId = await this.makeRequest('delete', '/api/admin/documents/invalid', null, {
        Authorization: `Bearer ${this.adminToken}`
      });
      if (!invalidDocId.success && invalidDocId.status === 400) {
        this.log('✅ Invalid document ID correctly rejected', 'success');
      } else {
        this.log(`❌ Invalid document ID should be rejected: ${JSON.stringify(invalidDocId)}`, 'error');
      }
    }
  }

  async testRateLimiting() {
    this.log('⏱️ Testing Rate Limiting...', 'info');

    // Test OTP rate limiting
    this.log('Testing OTP Rate Limiting...');
    const otpRequests = [];
    for (let i = 0; i < 5; i++) {
      otpRequests.push(this.makeRequest('post', '/api/auth/request-otp', {
        mobile: '+15559876543'
      }));
    }

    const results = await Promise.all(otpRequests);
    const rateLimited = results.some(r => !r.success && r.status === 429);
    if (rateLimited) {
      this.log('✅ OTP Rate Limiting working', 'success');
    } else {
      this.log('⚠️ OTP Rate Limiting may not be working properly', 'warning');
    }
  }

  async cleanup() {
    this.log('🧹 Cleaning up test data...', 'info');

    if (this.adminToken && this.testUserId) {
      this.log('Deleting test user...');
      const deleteUser = await this.makeRequest('delete', `/api/admin/users/${this.testUserId}`, null, {
        Authorization: `Bearer ${this.adminToken}`
      });
      if (deleteUser.success) {
        this.log('✅ Test user deleted', 'success');
      } else {
        this.log(`❌ Failed to delete test user: ${JSON.stringify(deleteUser.error)}`, 'error');
      }
    }

    if (this.adminToken && this.testDocumentId) {
      this.log('Deleting test document...');
      const deleteDoc = await this.makeRequest('delete', `/api/admin/documents/${this.testDocumentId}`, null, {
        Authorization: `Bearer ${this.adminToken}`
      });
      if (deleteDoc.success) {
        this.log('✅ Test document deleted', 'success');
      } else {
        this.log(`❌ Failed to delete test document: ${JSON.stringify(deleteDoc.error)}`, 'error');
      }
    }
  }

  async runAllTests() {
    try {
      this.log('🚀 Starting Comprehensive API Tests...', 'info');

      // Test authentication endpoints
      await this.testAuthenticationEndpoints();

      // Test user authentication flow
      await this.testUserAuthentication();

      // Test user endpoints
      await this.testUserEndpoints();

      // Test admin endpoints
      await this.testAdminEndpoints();

      // Test error cases
      await this.testErrorCases();

      // Test rate limiting
      await this.testRateLimiting();

      // Cleanup
      await this.cleanup();

      this.log('✅ All tests completed!', 'success');

    } catch (error) {
      this.log(`❌ Test suite failed: ${error.message}`, 'error');
    }
  }
}

// Run the tests
const tester = new APITester();
tester.runAllTests();
