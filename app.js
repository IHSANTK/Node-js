const http = require('http');
const fs = require('fs');
const url = require('url');
const path = require('path');

const server = http.createServer((req, res) => {
  const { pathname, query } = url.parse(req.url, true);

  if (pathname === '/') {
    res.writeHead(302, { 'Location': '/form' },);
    res.end();
  } else if (pathname === '/form') {
    displayUserForm(res, query.id);
  } else if (pathname === '/' || pathname === '/index') {
    displayUserList(res);
  } else if (pathname === '/add-user' && req.method === 'POST') {
    handleAddUser(req, res);
  } else if (pathname === '/delete-user' && req.method === 'POST') {
    handleDeleteUser(req, res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Page not found');
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

function displayUserForm(res, userId) {
  const userFormHTML = fs.readFileSync('form.html', 'utf8');

  const data = readData();

  const user = data.find(user => user.id === userId);

  const updatedFormHTML = userFormHTML
    .replace('<input type="hidden" name="id" value="">', `<input type="hidden" name="id" value="${user ? user.id : ''}">`)
    .replace('<input type="text" id="name" name="name" placeholder="Enter your name" >', `<input type="text" id="name" name="name" placeholder="Enter your name" value="${user ? user.name : ''}" >`)
    .replace('<input  type="number" id="number" name="number" placeholder="Enter your number" >',`<input type="number" id="number" name="number" placeholder="Enter your number" value="${user ? user.number : ''}" >`)
    .replace('<input type="email" id="email" name="email" placeholder="Enter your Email" >', `<input type="email" id="email" name="email"  placeholder="Enter your Email" value="${user ? user.email : ''}" >`)
    .replace('<input type="password" id="password" name="password" placeholder="Enter Password" >', `<input type="password" id="password" name="password"  placeholder="Enter Password" value="${user ? user.password : ''}" >`);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(updatedFormHTML);
}

 function displayUserList(res) {
  
  const data = readData();

  const userListHTML = fs.readFileSync('index.html', 'utf8');

  const dynamicRows = generateUserRows(data);
  const updatedHTML = userListHTML.replace('<!-- Users will be dynamically added here using JavaScript -->', dynamicRows);

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(updatedHTML);
}

function handleAddUser(req, res) {
  let body = '';

  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    
    const formData = new URLSearchParams(body);

    const data = readData();

    const id = formData.get('id');
    const name = formData.get('name');
    const number = formData.get('number');
    const email = formData.get('email');
    const password = formData.get('password');
   

    if (id) {

      const existingUserIndex = data.findIndex(user => user.id === id);
      if (existingUserIndex !== -1) {
  
        data[existingUserIndex].name = name;
        data[existingUserIndex].number = number;
        data[existingUserIndex].email = email;
        data[existingUserIndex].password = password;
   
      }
    } else {
      const newId = generateUniqueId();
      data.push({ id: newId, name,number,email,password });
    }

    saveData(data);

    res.writeHead(302, { 'Location': '/index' });
    res.end();
  });
}

function handleDeleteUser(req, res) {
  let body = '';

  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
  
    const formData = new URLSearchParams(body);
 
    const data = readData();
  
    const idToDelete = formData.get('id');
   
    const newData = data.filter(user => user.id !== idToDelete);

    saveData(newData);

    res.writeHead(302, { 'Location': '/index' });
    res.end();
  });
}

function generateUserRows(data) {

  const rows = data.map(user => `
    <tr>
      <td>${user.name}</td>
      <td>${user.number}</td>
      <td>${user.email}</td>
      <td>${user.password}</td>
        
     
      <td>
      <div style="display:flex">
       <button style="background-color: rgb(65, 65, 235);border:none; border-radius:3px;height:20px;width:60px;margin-left:25px;margin-top:10px;">
       <a style="color:black;" href="/form?id=${user.id}">Edit </a></button>
        
       <form method="post" action="/delete-user">
           <input type="hidden" name="id" value="${user.id}">
           <input style="background-color:  rgb(211, 53, 53);border:none; border-radius: 3px;height:20px;width:60px;margin-left:25px;margin-top:10px"type="submit" value="Delete ">
     </form> 
     </div>
      </td>
    </tr>
  `).join('');

  return rows;
}

function readData() {
  
  try {
    const dataPath = path.join(__dirname, 'data.json');
    const data = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function saveData(data) {
  const dataPath = path.join(__dirname, 'data.json');
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
}

function generateUniqueId() {
  return Date.now().toString();
}

