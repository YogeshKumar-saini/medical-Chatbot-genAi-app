import requests, time
BASE = 'http://localhost:8000/api/v1'

def login(email, password):
    r = requests.post(f'{BASE}/auth/login', json={'email': email, 'password': password})
    if r.status_code != 200:
        print('Login failed', r.status_code, r.text)
        return None
    data = r.json()
    return data['access_token'], data['user']['id']

def main():
    # Super admin login
    sa_token, _ = login('superadmin@example.com', 'password123')
    if not sa_token:
        return
    sa_headers = {'Authorization': f'Bearer {sa_token}'}
    # Create Org Admin
    ts = int(time.time())
    org_email = f'orgadmin{ts}@example.com'
    org_slug = f'del-org-{ts}'
    requests.post(f'{BASE}/auth/signup', json={'email': org_email, 'password': 'password123', 'name': 'Org Admin', 'role': 'ORG_ADMIN'})
    oa_token, _ = login(org_email, 'password123')
    if not oa_token:
        return
    oa_headers = {'Authorization': f'Bearer {oa_token}'}
    # Org Admin creates organization
    org_resp = requests.post(f'{BASE}/onboarding/organizations', json={'name': 'Del Org', 'slug': org_slug}, headers=oa_headers)
    if org_resp.status_code not in (200, 201):
        print('Org creation failed', org_resp.status_code, org_resp.text)
        return
    org_id = org_resp.json()['id']
    # Super admin verifies org
    requests.put(f'{BASE}/onboarding/admin/organizations/{org_id}/verify?verified=true', headers=sa_headers)
    # Create Doctor
    doc_email = f'doc{ts}@example.com'
    requests.post(f'{BASE}/auth/signup', json={'email': doc_email, 'password': 'password123', 'name': 'Doc', 'role': 'DOCTOR'})
    doc_token, doc_user_id = login(doc_email, 'password123')
    doc_headers = {'Authorization': f'Bearer {doc_token}'}
    # Doctor profile linked to org
    requests.post(f'{BASE}/onboarding/doctor/profile', json={'specialization': 'General', 'organization_id': org_id}, headers=doc_headers)
    # Super admin attempts delete
    del_resp = requests.delete(f'{BASE}/admin/users/{doc_user_id}', headers=sa_headers)
    print('Delete response', del_resp.status_code, del_resp.json())
    # Check if pending
    if del_resp.json().get('status') == 'PENDING':
        # Org admin list requests
        reqs = requests.get(f'{BASE}/admin/requests/delete', headers=oa_headers).json()
        print('Org admin requests', reqs)
        if reqs:
            req_id = reqs[0]['id']
            # Approve request
            app_resp = requests.post(f'{BASE}/admin/requests/delete/{req_id}/approve', headers=oa_headers)
            print('Approve response', app_resp.status_code, app_resp.json())
    else:
        print('Delete was immediate')

if __name__ == '__main__':
    main()
