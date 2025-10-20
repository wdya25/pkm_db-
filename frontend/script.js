
fetch('https://your-backend-url.onrender.com/api/data')
  .then(res => res.json())
  .then(data => {
    document.getElementById('output').textContent = JSON.stringify(data, null, 2);
  })
  .catch(err => {
    document.getElementById('output').textContent = 'Error: ' + err.message;
  });
