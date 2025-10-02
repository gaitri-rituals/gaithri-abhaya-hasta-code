const bcrypt = require('bcryptjs');

const password = process.argv[2] || 'password';

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  console.log('Password:', password);
  console.log('Hash:', hash);
  
  // Verify the hash
  bcrypt.compare(password, hash, (err, result) => {
    if (err) {
      console.error('Verification error:', err);
    } else {
      console.log('Verification:', result ? 'SUCCESS' : 'FAILED');
    }
    process.exit(0);
  });
});
