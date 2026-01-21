import requests
import sys
import json
from datetime import datetime, date, timedelta

class InsectControlAPITester:
    def __init__(self, base_url="https://pest-service-hub-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_result(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            
            if success:
                self.log_result(name, True)
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                details = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json().get('detail', '')
                    if error_detail:
                        details += f" - {error_detail}"
                except:
                    pass
                self.log_result(name, False, details)
                return False, {}

        except Exception as e:
            self.log_result(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_auth_bootstrap(self):
        """Test bootstrap status"""
        return self.run_test("Auth Bootstrap Status", "GET", "auth/bootstrap/status", 200)

    def test_user_registration(self, name, username, password):
        """Test user registration"""
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={"name": name, "username": username, "password": password}
        )
        return success, response

    def test_user_login(self, username, password):
        """Test login and get token"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={"username": username, "password": password}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   Token acquired: {self.token[:20]}...")
            return True, response
        return False, {}

    def test_auth_me(self):
        """Test getting current user info"""
        return self.run_test("Get Current User", "GET", "auth/me", 200)

    def test_create_client(self, name, phone=None, address=None, city=None, neighborhood=None, email=None):
        """Create a client"""
        client_data = {"name": name}
        if phone: client_data["phone"] = phone
        if address: client_data["address"] = address
        if city: client_data["city"] = city
        if neighborhood: client_data["neighborhood"] = neighborhood
        if email: client_data["email"] = email
        
        success, response = self.run_test(
            "Create Client",
            "POST",
            "clients",
            200,
            data=client_data
        )
        return response.get('id') if success else None, response

    def test_list_clients(self, search_query=None):
        """List clients"""
        endpoint = "clients"
        if search_query:
            endpoint += f"?q={search_query}"
        return self.run_test("List Clients", "GET", endpoint, 200)

    def test_get_client(self, client_id):
        """Get a client by ID"""
        return self.run_test("Get Client", "GET", f"clients/{client_id}", 200)

    def test_update_client(self, client_id, updates):
        """Update a client"""
        return self.run_test("Update Client", "PUT", f"clients/{client_id}", 200, data=updates)

    def test_delete_client(self, client_id):
        """Delete a client"""
        return self.run_test("Delete Client", "DELETE", f"clients/{client_id}", 200)

    def test_delete_client_with_services(self, client_id):
        """Test deleting client with services (should fail)"""
        return self.run_test("Delete Client with Services", "DELETE", f"clients/{client_id}", 400)

    def test_create_service(self, client_id, service_date, service_type, value=0, status="PENDENTE"):
        """Create a service"""
        service_data = {
            "client_id": client_id,
            "date": service_date,
            "service_type": service_type,
            "value": value,
            "status": status
        }
        
        success, response = self.run_test(
            "Create Service",
            "POST",
            "services",
            200,
            data=service_data
        )
        return response.get('id') if success else None, response

    def test_list_services(self, status=None, from_date=None, to_date=None, client_id=None):
        """List services with filters"""
        params = []
        if status: params.append(f"status={status}")
        if from_date: params.append(f"from={from_date}")
        if to_date: params.append(f"to={to_date}")
        if client_id: params.append(f"client_id={client_id}")
        
        endpoint = "services"
        if params:
            endpoint += "?" + "&".join(params)
            
        return self.run_test("List Services", "GET", endpoint, 200)

    def test_get_service(self, service_id):
        """Get a service by ID"""
        return self.run_test("Get Service", "GET", f"services/{service_id}", 200)

    def test_update_service(self, service_id, updates):
        """Update a service"""
        return self.run_test("Update Service", "PUT", f"services/{service_id}", 200, data=updates)

    def test_delete_service(self, service_id):
        """Delete a service"""
        return self.run_test("Delete Service", "DELETE", f"services/{service_id}", 200)

    def test_dashboard_summary(self):
        """Test dashboard summary"""
        return self.run_test("Dashboard Summary", "GET", "dashboard/summary", 200)

def main():
    print("🚀 Starting InsectControl Tupy API Tests")
    print("=" * 50)
    
    tester = InsectControlAPITester()
    
    # Test basic connectivity
    print("\n📡 Testing Basic Connectivity")
    tester.test_root_endpoint()
    tester.test_auth_bootstrap()
    
    # Test user registration and authentication
    print("\n👤 Testing Authentication")
    test_user = f"testuser_{datetime.now().strftime('%H%M%S')}"
    test_password = "TestPass123!"
    
    success, user_data = tester.test_user_registration("Test User", test_user, test_password)
    if not success:
        print("❌ User registration failed, stopping tests")
        return 1
    
    success, login_data = tester.test_user_login(test_user, test_password)
    if not success:
        print("❌ Login failed, stopping tests")
        return 1
    
    tester.test_auth_me()
    
    # Test client management
    print("\n👥 Testing Client Management")
    client_id, client_data = tester.test_create_client(
        "Test Client", 
        phone="(21) 99999-9999",
        address="Rua Teste, 123",
        city="Rio de Janeiro",
        neighborhood="Centro",
        email="test@example.com"
    )
    
    if not client_id:
        print("❌ Client creation failed, stopping tests")
        return 1
    
    tester.test_list_clients()
    tester.test_list_clients("Test Client")  # Search test
    tester.test_get_client(client_id)
    tester.test_update_client(client_id, {"phone": "(21) 88888-8888"})
    
    # Test service management
    print("\n🔧 Testing Service Management")
    today = date.today()
    service_id, service_data = tester.test_create_service(
        client_id,
        today.isoformat(),
        "Desinsetização - Baratas",
        150.00,
        "PENDENTE"
    )
    
    if not service_id:
        print("❌ Service creation failed, stopping tests")
        return 1
    
    tester.test_list_services()
    tester.test_list_services(status="PENDENTE")
    tester.test_list_services(from_date=today.isoformat(), to_date=today.isoformat())
    tester.test_get_service(service_id)
    
    # Test service update (change status and value)
    tester.test_update_service(service_id, {"status": "CONCLUIDO", "value": 200.00})
    
    # Test dashboard (should reflect the service changes)
    print("\n📊 Testing Dashboard")
    tester.test_dashboard_summary()
    
    # Test service filters
    print("\n🔍 Testing Service Filters")
    tester.test_list_services(status="CONCLUIDO")
    
    # Test client deletion constraint (should fail with services)
    print("\n🚫 Testing Client Deletion Constraint")
    tester.test_delete_client_with_services(client_id)
    
    # Clean up - delete service first, then client
    print("\n🧹 Cleanup")
    tester.test_delete_service(service_id)
    tester.test_delete_client(client_id)
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed. Check the details above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())