const apiKey = 'AIzaSyBhElj_3kG-8X09JsQS5t0IJR9I_mzYQJc';
const projectId = 'fire-baadshah-arena';

async function run() {
  const randEmail = 'testuser' + Date.now() + '@gmail.com';
  let res = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + apiKey, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: randEmail, password: 'password123', returnSecureToken: true })
  });
  let data = await res.json();
  const idToken = data.idToken;
  
  const fsRes = await fetch('https://firestore.googleapis.com/v1/projects/' + projectId + '/databases/(default)/documents/users?pageSize=1000', {
    headers: { 'Authorization': 'Bearer ' + idToken }
  });
  const fsData = await fsRes.json();
  if (fsData.documents) {
    const today = new Date().toLocaleDateString('en-GB');
    const usersCreatedToday = fsData.documents.filter(doc => {
      const createdAt = doc.fields.createdAt?.stringValue;
      if (!createdAt) return false;
      return createdAt.startsWith(today) || createdAt.includes('29/06/2026') || createdAt.includes('6/29/2026') || createdAt.includes('29/6/2026');
    });
    usersCreatedToday.forEach(u => {
      console.log(u.fields.email.stringValue, 'Blocked:', u.fields.blocked?.booleanValue || false);
    });
  }
}
run();
